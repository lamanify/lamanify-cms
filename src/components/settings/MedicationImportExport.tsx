import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useMedications, MedicationWithPricing } from '@/hooks/useMedications';
import { usePriceTiers } from '@/hooks/usePriceTiers';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportData {
  [key: string]: string | number;
}

interface ColumnMapping {
  fileColumn: string;
  systemField: string;
}

interface ValidationError {
  row: number;
  column: string;
  error: string;
}

const SYSTEM_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'generic_name', label: 'Generic Name' },
  { value: 'category', label: 'Category' },
  { value: 'groups', label: 'Group' },
  { value: 'unit_of_measure', label: 'Unit of Measure (UOM)' },
  { value: 'cost_price', label: 'Cost Price (RM)' },
  { value: 'stock_level', label: 'Stock Level' },
  { value: 'remarks', label: 'Remarks' },
];

export function MedicationImportExport({ medications }: { medications: MedicationWithPricing[] }) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validRows, setValidRows] = useState<ImportData[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createMedication, updateMedication } = useMedications();
  const { priceTiers } = usePriceTiers();
  const { toast } = useToast();

  // Export functionality
  const handleExport = () => {
    if (medications.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no medications to export.",
        variant: "destructive"
      });
      return;
    }

    // Prepare export data
    const exportData = medications.map(med => {
      const row: any = {
        'Name': med.name,
        'Generic Name': med.generic_name || '',
        'Category': med.category || '',
        'Group': med.groups?.join(', ') || '',
        'Unit of Measure (UOM)': med.unit_of_measure || '',
        'Cost Price (RM)': med.cost_price || 0,
        'Stock Level': med.stock_level || 0,
        'Remarks': med.remarks || '',
      };

      // Add tier pricing columns
      priceTiers.forEach(tier => {
        row[`${tier.tier_name} Price`] = med.pricing?.[tier.id] || 0;
      });

      return row;
    });

    // Create Excel file
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medications');
    
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `medications_export_${today}.xlsx`);

    toast({
      title: "Export completed",
      description: `Exported ${medications.length} medications successfully.`
    });
  };

  // Generate sample template
  const handleDownloadTemplate = () => {
    const sampleData = [{
      'Name': 'Amoxil 125mg/5mL',
      'Generic Name': 'Amoxicillin',
      'Category': 'Medication',
      'Group': 'Antibiotics',
      'Unit of Measure (UOM)': 'Bottle',
      'Cost Price (RM)': 15.50,
      'Stock Level': 50,
      'Remarks': 'Keep refrigerated',
      ...Object.fromEntries(priceTiers.map(tier => [`${tier.tier_name} Price`, 25.00]))
    }];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, 'medication_import_template.xlsx');

    toast({
      title: "Template downloaded",
      description: "Sample template file has been downloaded."
    });
  };

  // File processing function (shared between file input and drag & drop)
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data: ImportData[] = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          Papa.parse(e.target?.result as string, {
            header: true,
            complete: (results) => {
              data = results.data as ImportData[];
            }
          });
        } else {
          // Parse Excel
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet) as ImportData[];
        }

        if (data.length === 0) {
          toast({
            title: "No data found",
            description: "The uploaded file appears to be empty.",
            variant: "destructive"
          });
          return;
        }

        // Extract columns and setup initial mapping
        const columns = Object.keys(data[0]);
        setFileColumns(columns);
        setImportData(data);

        // Auto-map columns based on similarity
        const initialMapping: ColumnMapping[] = columns.map(col => {
          const systemField = SYSTEM_FIELDS.find(sf => 
            sf.label.toLowerCase() === col.toLowerCase() ||
            sf.value.toLowerCase() === col.toLowerCase().replace(/\s+/g, '_')
          );
          
          return {
            fileColumn: col,
            systemField: systemField?.value || ''
          };
        });

        setColumnMapping(initialMapping);
        setImportStep(2);

      } catch (error) {
        toast({
          title: "File parsing error",
          description: "Unable to parse the uploaded file. Please check the format.",
          variant: "destructive"
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Check file type
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or XLSX file.",
          variant: "destructive"
        });
        return;
      }
      
      processFile(file);
    }
  };

  // Validate data
  const validateData = () => {
    const errors: ValidationError[] = [];
    const valid: ImportData[] = [];

    importData.forEach((row, index) => {
      const mappedRow: any = {};
      let hasErrors = false;

      // Map columns according to user mapping
      columnMapping.forEach(mapping => {
        if (mapping.systemField) {
          mappedRow[mapping.systemField] = row[mapping.fileColumn];
        }
      });

      // Validate required fields
      if (!mappedRow.name || mappedRow.name.toString().trim() === '') {
        errors.push({
          row: index + 1,
          column: 'name',
          error: 'Name is required'
        });
        hasErrors = true;
      }

      // Validate numeric fields
      ['cost_price', 'stock_level'].forEach(field => {
        if (mappedRow[field] && isNaN(Number(mappedRow[field]))) {
          errors.push({
            row: index + 1,
            column: field,
            error: 'Must be a valid number'
          });
          hasErrors = true;
        }
      });

      if (!hasErrors) {
        valid.push(mappedRow);
      }
    });

    setValidationErrors(errors);
    setValidRows(valid);
    setImportStep(3);
  };

  // Process import
  const processImport = async () => {
    setImporting(true);
    let added = 0;
    let updated = 0;

    try {
      for (const row of validRows) {
        // Check if medication exists
        const existing = medications.find(med => 
          med.name.toLowerCase() === row.name.toString().toLowerCase()
        );

        const medicationData = {
          name: row.name.toString(),
          generic_name: row.generic_name?.toString() || '',
          category: row.category?.toString() || 'Medication',
          groups: row.groups ? [row.groups.toString()] : [],
          cost_price: Number(row.cost_price) || 0,
          stock_level: Number(row.stock_level) || 0,
          remarks: row.remarks?.toString() || '',
          enable_dosage_settings: false,
          unit_of_measure: row.unit_of_measure?.toString() || 'Tablet',
          pricing: {} as { [tierId: string]: number },
          dosage_template: undefined
        };

        // Map tier pricing
        priceTiers.forEach(tier => {
          const priceColumn = `${tier.tier_name} Price`;
          if (row[priceColumn]) {
            medicationData.pricing[tier.id] = Number(row[priceColumn]) || 0;
          }
        });

        if (existing) {
          await updateMedication(existing.id, medicationData);
          updated++;
        } else {
          await createMedication(medicationData);
          added++;
        }
      }

      toast({
        title: "Import completed",
        description: `Import complete. ${added} medications were added, and ${updated} were updated.`
      });

      // Reset and close
      setImportStep(1);
      setImportData([]);
      setFileColumns([]);
      setColumnMapping([]);
      setValidationErrors([]);
      setValidRows([]);
      setIsImportOpen(false);

    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import. Please try again.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExport}
        variant="outline"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Button
        onClick={() => setIsImportOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Import Medications - Step {importStep} of 3
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: File Upload */}
          {importStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Medication File</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your CSV or XLSX file here, or click to browse
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={handleDownloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download sample template
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {importStep === 2 && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Review and confirm the column mapping below. The system has made its best guess, but you can adjust if needed.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-medium">Column Mapping</h3>
                {columnMapping.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <Label className="text-sm font-medium">
                        Column from Your File
                      </Label>
                      <Input value={mapping.fileColumn} disabled />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Maps to System Field
                      </Label>
                      <Select
                        value={mapping.systemField}
                        onValueChange={(value) => {
                          const updated = [...columnMapping];
                          updated[index].systemField = value;
                          setColumnMapping(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Skip this column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Skip this column</SelectItem>
                          {SYSTEM_FIELDS.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                          {priceTiers.map(tier => (
                            <SelectItem key={`tier_${tier.id}`} value={`${tier.tier_name} Price`}>
                              {tier.tier_name} Price
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportStep(1)}
                >
                  Back
                </Button>
                <Button onClick={validateData}>
                  Continue to Preview
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Data Validation and Preview */}
          {importStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Import Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    {validRows.length} records are ready to import. 
                    {validationErrors.length > 0 && ` ${validationErrors.length} records have errors and will be skipped.`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validRows.length} Valid
                  </Badge>
                  {validationErrors.length > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <X className="h-3 w-3" />
                      {validationErrors.length} Errors
                    </Badge>
                  )}
                </div>
              </div>

              {/* Show errors if any */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Validation Errors:</p>
                      {validationErrors.slice(0, 5).map((error, index) => (
                        <p key={index} className="text-sm">
                          Row {error.row}: {error.error} ({error.column})
                        </p>
                      ))}
                      {validationErrors.length > 5 && (
                        <p className="text-sm">...and {validationErrors.length - 5} more errors</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview table */}
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Generic Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Cost Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validRows.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.generic_name || '-'}</TableCell>
                            <TableCell>{row.category || '-'}</TableCell>
                            <TableCell>{row.stock_level || 0}</TableCell>
                            <TableCell>RM {Number(row.cost_price || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {validRows.length > 10 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      ...and {validRows.length - 10} more records
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportStep(2)}
                  disabled={importing}
                >
                  Back
                </Button>
                <Button
                  onClick={processImport}
                  disabled={importing || validRows.length === 0}
                >
                  {importing ? 'Importing...' : `Import ${validRows.length} Records`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}