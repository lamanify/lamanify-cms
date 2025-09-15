import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generatePatientId } from '@/lib/patientIdGenerator';
import { 
  X, 
  User, 
  Upload, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  CreditCard,
  AlertTriangle,
  FileText,
  Clock,
  Trash2
} from 'lucide-react';
import { usePatientDrafts } from '@/hooks/usePatientDrafts';
import { Badge } from '@/components/ui/badge';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientRegistered: () => void;
  draftId?: string | null;
}

interface PatientFormData {
  // Step 1 - Patient Information
  image?: string;
  name: string;
  idType: 'NRIC/MyKad' | 'Birth Certificate' | 'Passport' | 'Other';
  nric_passport: string;
  countryOfIssue?: string;
  otherIdDescription?: string;
  parentGuardianName?: string;
  parentGuardianNric?: string;
  phone: string;
  countryCode: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
  
  // Step 2 - Visit Information
  assignedDoctorId?: string;
  visitNotes: string;
  isUrgent: boolean;
  paymentMethod: string;
  paymentMethodNotes: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

export function PatientRegistrationModal({
  isOpen,
  onClose,
  onPatientRegistered,
  draftId
}: PatientRegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Draft management hook
  const { saveDraft, deleteDraft, autoSaveStatus } = usePatientDrafts();

  // Cookie key for auto-save (keeping for backward compatibility)
  const AUTOSAVE_COOKIE_KEY = 'patient_registration_autosave';

  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    idType: 'NRIC/MyKad',
    nric_passport: '',
    countryOfIssue: '',
    otherIdDescription: '',
    parentGuardianName: '',
    parentGuardianNric: '',
    phone: '',
    countryCode: '+60',
    email: '',
    dateOfBirth: '',
    gender: '',
    addressLine1: '',
    addressLine2: '',
    postcode: '',
    city: '',
    state: '',
    country: 'Malaysia',
    assignedDoctorId: 'none',
    visitNotes: '',
    isUrgent: false,
    paymentMethod: 'Self pay',
    paymentMethodNotes: ''
  });

  // Helper functions for cookie operations
  const saveFormDataToCookies = (data: PatientFormData) => {
    try {
      const jsonData = JSON.stringify(data);
      document.cookie = `${AUTOSAVE_COOKIE_KEY}=${encodeURIComponent(jsonData)}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    } catch (error) {
      console.error('Error saving form data to cookies:', error);
    }
  };

  const loadFormDataFromCookies = (): PatientFormData | null => {
    try {
      const cookies = document.cookie.split(';');
      const autosaveCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${AUTOSAVE_COOKIE_KEY}=`)
      );
      
      if (autosaveCookie) {
        const cookieValue = autosaveCookie.split('=')[1];
        const decodedValue = decodeURIComponent(cookieValue);
        return JSON.parse(decodedValue);
      }
    } catch (error) {
      console.error('Error loading form data from cookies:', error);
    }
    return null;
  };

  const clearFormDataFromCookies = () => {
    document.cookie = `${AUTOSAVE_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  };

  // Load draft data or saved form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (draftId) {
        // Load specific draft
        const drafts = JSON.parse(localStorage.getItem('patient_drafts') || '[]');
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) {
          setFormData(draft.draft_data);
          setIsDraftMode(true);
          setCurrentDraftId(draftId);
          toast({
            title: "Draft loaded",
            description: "Your draft has been loaded for editing.",
          });
        }
      } else {
        // Load from cookies (backward compatibility)
        const savedData = loadFormDataFromCookies();
        if (savedData) {
          setFormData(savedData);
          toast({
            title: "Draft restored",
            description: "Your previous form data has been restored.",
          });
        }
      }
      fetchDoctors();
    }
  }, [isOpen, draftId]);

  // Auto-save functionality with faster feedback (5 seconds instead of 30)
  useEffect(() => {
    if (isOpen && (formData.name || formData.nric_passport || formData.phone || formData.email)) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save (5 seconds for faster demo)
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const newDraftId = await saveDraft(formData, currentDraftId);
          if (newDraftId && !currentDraftId) {
            setCurrentDraftId(newDraftId);
            setIsDraftMode(true);
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 5000); // 5 seconds for demo

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }
  }, [formData, isOpen, currentDraftId, saveDraft]);

  // Save draft when form changes (debounced to 500ms for responsiveness)
  useEffect(() => {
    if (isOpen && (formData.name || formData.nric_passport || formData.phone || formData.email)) {
      // Also save to cookies for backward compatibility
      const timeoutId = setTimeout(() => {
        saveFormDataToCookies(formData);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, isOpen]);

  // Check if there's saved data
  const hasSavedData = () => {
    const savedData = loadFormDataFromCookies();
    return savedData && (savedData.name || savedData.nric_passport || savedData.phone || savedData.email);
  };

  // Clear draft function
  const clearDraft = async () => {
    clearFormDataFromCookies();
    
    // Also clear from drafts if in draft mode
    if (currentDraftId) {
      await deleteDraft(currentDraftId);
      setCurrentDraftId(null);
      setIsDraftMode(false);
    }
    
    setFormData({
      name: '',
      idType: 'NRIC/MyKad',
      nric_passport: '',
      countryOfIssue: '',
      otherIdDescription: '',
      parentGuardianName: '',
      parentGuardianNric: '',
      phone: '',
      countryCode: '+60',
      email: '',
      dateOfBirth: '',
      gender: '',
      addressLine1: '',
      addressLine2: '',
      postcode: '',
      city: '',
      state: '',
      country: 'Malaysia',
      assignedDoctorId: 'none',
      visitNotes: '',
      isUrgent: false,
      paymentMethod: 'Self pay',
      paymentMethodNotes: ''
    });
    toast({
      title: "Draft cleared",
      description: "Form has been reset and draft removed.",
    });
  };

  // Fetch doctors when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'doctor')
        .eq('status', 'active');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Handle image upload - for now just show success
      toast({
        title: "Image uploaded",
        description: "Profile image has been selected",
      });
    }
  };

  const handleNext = () => {
    // Validate Step 1
    const requiredFields = ['name', 'nric_passport', 'dateOfBirth', 'gender', 'phone'];
    
    // Add conditional required fields
    if (formData.idType === 'Birth Certificate') {
      requiredFields.push('parentGuardianName', 'parentGuardianNric');
    }
    if (formData.idType === 'Passport') {
      requiredFields.push('countryOfIssue');
    }
    if (formData.idType === 'Other') {
      requiredFields.push('otherIdDescription');
    }
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof PatientFormData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Generate patient ID
      const patientId = await generatePatientId();

          // Create additional notes with ID information
          let additionalNotes = '';
          if (formData.idType === 'NRIC/MyKad') {
            additionalNotes = `NRIC: ${formData.nric_passport}`;
          } else if (formData.idType === 'Birth Certificate') {
            additionalNotes = `Birth Certificate: ${formData.nric_passport}\nParent/Guardian: ${formData.parentGuardianName} (NRIC: ${formData.parentGuardianNric})`;
          } else if (formData.idType === 'Passport') {
            additionalNotes = `Passport: ${formData.nric_passport} (${formData.countryOfIssue})`;
          } else if (formData.idType === 'Other') {
            additionalNotes = `${formData.otherIdDescription}: ${formData.nric_passport}`;
          }

          // Create patient record
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .insert({
              patient_id: patientId,
              first_name: firstName,
              last_name: lastName,
              date_of_birth: formData.dateOfBirth,
              gender: formData.gender.toLowerCase(),
              phone: formData.countryCode + formData.phone,
              email: formData.email || null,
              address: `${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}, ${formData.postcode} ${formData.city}, ${formData.state}, ${formData.country}`,
              visit_reason: formData.visitNotes || null,
              additional_notes: additionalNotes
            })
            .select()
            .single();

      if (patientError) throw patientError;

      // Create queue entry
      const { data: queueNumber } = await supabase.rpc('generate_queue_number');
      
      const { error: queueError } = await supabase
        .from('patient_queue')
        .insert({
          patient_id: patient.id,
          queue_number: queueNumber,
          assigned_doctor_id: formData.assignedDoctorId === "none" ? null : formData.assignedDoctorId || null,
          status: formData.isUrgent ? 'urgent' : 'waiting'
        });

      if (queueError) throw queueError;

      // Create patient activity for registration
      await supabase
        .from('patient_activities')
        .insert({
          patient_id: patient.id,
          activity_type: 'registration',
          title: 'Patient Registration',
          content: `New patient registered - ${formData.name}`,
          metadata: {
            payment_method: formData.paymentMethod,
            payment_method_notes: formData.paymentMethodNotes,
            visit_notes: formData.visitNotes,
            is_urgent: formData.isUrgent,
            assigned_doctor: formData.assignedDoctorId === "none" ? null : formData.assignedDoctorId
          }
        });

      toast({
        title: "Success",
        description: `Patient ${formData.name} has been registered successfully with queue number ${queueNumber}`,
      });

    // Also clear from drafts on successful registration
    if (currentDraftId) {
      await deleteDraft(currentDraftId);
    }
    
    // Clear auto-saved form data from cookies on successful submission
    clearFormDataFromCookies();

      onPatientRegistered();
      handleClose();
    } catch (error) {
      console.error('Error registering patient:', error);
      toast({
        title: "Error",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      name: '',
      idType: 'NRIC/MyKad',
      nric_passport: '',
      countryOfIssue: '',
      otherIdDescription: '',
      parentGuardianName: '',
      parentGuardianNric: '',
      phone: '',
      countryCode: '+60',
      email: '',
      dateOfBirth: '',
      gender: '',
      addressLine1: '',
      addressLine2: '',
      postcode: '',
      city: '',
      state: '',
      country: 'Malaysia',
      assignedDoctorId: 'none',
      visitNotes: '',
      isUrgent: false,
      paymentMethod: 'Self pay',
      paymentMethodNotes: ''
    });
    onClose();
  };

  // Function to parse date of birth from NRIC
  const parseNRICDateOfBirth = (nric: string): string => {
    if (nric.length < 6) return '';
    
    const dateStr = nric.substring(0, 6); // First 6 digits: YYMMDD
    const year = dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    
    // Convert 2-digit year to 4-digit year
    // Assuming years 00-30 are 2000s, 31-99 are 1900s
    const fullYear = parseInt(year) <= 30 ? `20${year}` : `19${year}`;
    
    return `${fullYear}-${month}-${day}`;
  };

  const updateFormData = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-parse date of birth from NRIC when NRIC/MyKad is selected and changed
      if (field === 'nric_passport' && prev.idType === 'NRIC/MyKad' && typeof value === 'string') {
        const parsedDate = parseNRICDateOfBirth(value);
        if (parsedDate && parsedDate !== '--') {
          newData.dateOfBirth = parsedDate;
        }
      }
      
      // Clear conditional fields when ID type changes
      if (field === 'idType') {
        newData.nric_passport = '';
        newData.countryOfIssue = '';
        newData.otherIdDescription = '';
        newData.parentGuardianName = '';
        newData.parentGuardianNric = '';
        if (value !== 'NRIC/MyKad') {
          newData.dateOfBirth = '';
        }
      }
      
      return newData;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-bold">
                  {currentStep === 1 ? 'Patient Information' : 'Visit Information'}
                </DialogTitle>
                {isDraftMode && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    <FileText className="h-3 w-3 mr-1" />
                    Draft Mode
                  </Badge>
                )}
                {/* Always show draft status for visibility */}
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Auto-save: {autoSaveStatus || 'Ready'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {/* Show clear button when form has data */}
                {isOpen && (formData.name || formData.nric_passport || formData.phone || formData.email || hasSavedData()) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearDraft}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Draft
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Auto-save status */}
            {autoSaveStatus && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {autoSaveStatus}
              </div>
            )}
            
            {/* Step Indicator */}
            <div className="flex items-center mt-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className={`h-0.5 w-16 mx-2 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Patient Image */}
                    <div>
                      <Label className="text-sm font-medium">Patient Image</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <Button variant="outline" onClick={handleImageUpload}>
                          <Upload className="h-4 w-4 mr-2" />
                          Add image
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        placeholder="Enter full name"
                        className="mt-1"
                      />
                    </div>

                    {/* ID Type Selection */}
                    <div>
                      <Label className="text-sm font-medium">ID Type *</Label>
                      <Select value={formData.idType} onValueChange={(value: 'NRIC/MyKad' | 'Birth Certificate' | 'Passport' | 'Other') => updateFormData('idType', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NRIC/MyKad">NRIC/MyKad</SelectItem>
                          <SelectItem value="Birth Certificate">Birth Certificate</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ID Number Field - Conditional based on ID Type */}
                    <div>
                      <Label htmlFor="nric" className="text-sm font-medium">
                        {formData.idType === 'NRIC/MyKad' && 'NRIC Number *'}
                        {formData.idType === 'Birth Certificate' && 'Birth Certificate Number *'}
                        {formData.idType === 'Passport' && 'Passport Number *'}
                        {formData.idType === 'Other' && 'ID Number *'}
                      </Label>
                      <Input
                        id="nric"
                        value={formData.nric_passport}
                        onChange={(e) => updateFormData('nric_passport', e.target.value)}
                        placeholder={
                          formData.idType === 'NRIC/MyKad' ? '930202148832' :
                          formData.idType === 'Birth Certificate' ? 'BC123456' :
                          formData.idType === 'Passport' ? 'A1234567' :
                          'Enter ID number'
                        }
                        className="mt-1"
                      />
                    </div>

                    {/* Country of Issue - Only for Passport */}
                    {formData.idType === 'Passport' && (
                      <div>
                        <Label htmlFor="countryOfIssue" className="text-sm font-medium">Country of Issue *</Label>
                        <Input
                          id="countryOfIssue"
                          value={formData.countryOfIssue || ''}
                          onChange={(e) => updateFormData('countryOfIssue', e.target.value)}
                          placeholder="Malaysia"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Other ID Description - Only for Other */}
                    {formData.idType === 'Other' && (
                      <div>
                        <Label htmlFor="otherIdDescription" className="text-sm font-medium">ID Description *</Label>
                        <Input
                          id="otherIdDescription"
                          value={formData.otherIdDescription || ''}
                          onChange={(e) => updateFormData('otherIdDescription', e.target.value)}
                          placeholder="e.g., Work Permit, Student ID"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Parent/Guardian Fields - Only for Birth Certificate */}
                    {formData.idType === 'Birth Certificate' && (
                      <>
                        <div>
                          <Label htmlFor="parentGuardianName" className="text-sm font-medium">Parent/Guardian Name *</Label>
                          <Input
                            id="parentGuardianName"
                            value={formData.parentGuardianName || ''}
                            onChange={(e) => updateFormData('parentGuardianName', e.target.value)}
                            placeholder="Full name of parent/guardian"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="parentGuardianNric" className="text-sm font-medium">Parent/Guardian NRIC *</Label>
                          <Input
                            id="parentGuardianNric"
                            value={formData.parentGuardianNric || ''}
                            onChange={(e) => updateFormData('parentGuardianNric', e.target.value)}
                            placeholder="NRIC of parent/guardian"
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                      <div className="flex mt-1">
                        <Select value={formData.countryCode} onValueChange={(value) => updateFormData('countryCode', value)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+60">🇲🇾 +60</SelectItem>
                            <SelectItem value="+65">🇸🇬 +65</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          placeholder="123456789"
                          className="ml-2 flex-1"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="Email (Optional)"
                        className="mt-1"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <Label htmlFor="dob" className="text-sm font-medium">Date of birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                        className="mt-1"
                        disabled={formData.idType === 'NRIC/MyKad' && formData.nric_passport.length >= 6}
                      />
                      {formData.idType === 'NRIC/MyKad' && formData.nric_passport.length >= 6 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Auto-filled from NRIC
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Gender */}
                    <div>
                      <Label className="text-sm font-medium">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Address Line 1 */}
                    <div>
                      <Label htmlFor="address1" className="text-sm font-medium">Address Line 1</Label>
                      <Input
                        id="address1"
                        value={formData.addressLine1}
                        onChange={(e) => updateFormData('addressLine1', e.target.value)}
                        placeholder="9, Jalan USJ 11/1A"
                        className="mt-1"
                      />
                    </div>

                    {/* Address Line 2 */}
                    <div>
                      <Label htmlFor="address2" className="text-sm font-medium">Address Line 2</Label>
                      <Input
                        id="address2"
                        value={formData.addressLine2}
                        onChange={(e) => updateFormData('addressLine2', e.target.value)}
                        placeholder="e.g. IOI Resort City"
                        className="mt-1"
                      />
                    </div>

                    {/* Postcode */}
                    <div>
                      <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => updateFormData('postcode', e.target.value)}
                        placeholder="47600"
                        className="mt-1"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        placeholder="Subang Jaya"
                        className="mt-1"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <Label htmlFor="state" className="text-sm font-medium">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => updateFormData('state', e.target.value)}
                        placeholder="Selangor"
                        className="mt-1"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => updateFormData('country', e.target.value)}
                        placeholder="Malaysia"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Patient Details */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Patient details</h3>
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      Edit
                    </Button>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{formData.name}</h4>
                          <p className="text-sm text-muted-foreground">{formData.nric_passport}</p>
                          <p className="text-sm text-muted-foreground">
                            {formData.dateOfBirth ? `${new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear()} years old` : ''} • {formData.gender}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Email</span>
                          <p className="text-sm">{formData.email || '-'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Phone number</span>
                          <p className="text-sm">{formData.countryCode}{formData.phone}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Address</span>
                          <p className="text-sm">
                            {`${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}, ${formData.postcode} ${formData.city}, ${formData.state}, ${formData.country}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Visit Information */}
                <div className="space-y-6">
                  {/* Doctor Selection */}
                  <div>
                    <div className="bg-primary text-primary-foreground p-3 rounded-t-lg">
                      <h4 className="font-medium">Choose Doctor (Optional)</h4>
                      <p className="text-sm opacity-90">Note: Other doctor can also take up this patient</p>
                    </div>
                    <div className="border border-t-0 p-4 rounded-b-lg">
                      <Label className="text-sm font-medium">Doctor (Optional)</Label>
                      <Select value={formData.assignedDoctorId} onValueChange={(value) => updateFormData('assignedDoctorId', value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific doctor</SelectItem>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              Dr {doctor.first_name} {doctor.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Visit Notes */}
                  <div>
                    <Label htmlFor="visitNotes" className="text-sm font-medium">Visit notes</Label>
                    <Textarea
                      id="visitNotes"
                      value={formData.visitNotes}
                      onChange={(e) => updateFormData('visitNotes', e.target.value)}
                      placeholder="Eg: Shortness of breath"
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  {/* Mark as urgent */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={formData.isUrgent}
                      onCheckedChange={(checked) => updateFormData('isUrgent', checked as boolean)}
                    />
                    <Label htmlFor="urgent" className="text-sm font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                      Mark this visit as urgent
                    </Label>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <div className="bg-primary text-primary-foreground p-3 rounded-t-lg">
                      <h4 className="font-medium">Choose Payment method here</h4>
                    </div>
                    <div className="border border-t-0 p-4 rounded-b-lg space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Payment method</Label>
                        <Select value={formData.paymentMethod} onValueChange={(value) => updateFormData('paymentMethod', value)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Self pay">Self pay</SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                            <SelectItem value="Company">Company</SelectItem>
                            <SelectItem value="Government">Government</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Conditional Payment Method Notes */}
                      {(formData.paymentMethod === 'Insurance' || formData.paymentMethod === 'Company' || formData.paymentMethod === 'Self pay') && (
                        <div>
                          <Label htmlFor="paymentNotes" className="text-sm font-medium text-muted-foreground">
                            {formData.paymentMethod === 'Insurance' && 'Insurance details'}
                            {formData.paymentMethod === 'Company' && 'Company details'}
                            {formData.paymentMethod === 'Self pay' && 'Payment notes'}
                          </Label>
                          <Input
                            id="paymentNotes"
                            value={formData.paymentMethodNotes}
                            onChange={(e) => updateFormData('paymentMethodNotes', e.target.value)}
                            placeholder={
                              formData.paymentMethod === 'Insurance' ? 'e.g., Great Eastern, policy #12345' :
                              formData.paymentMethod === 'Company' ? 'e.g., ABC Corporation' :
                              'e.g., Budget limit: RM500'
                            }
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t">
            {currentStep === 1 ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleNext}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Registering...' : isDraftMode ? 'Complete Registration' : 'Register Patient'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}