import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { generatePatientId } from '@/lib/patientIdGenerator';
import { 
  User, 
  Phone, 
  Calendar, 
  Upload, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Camera,
  MapPin,
  Mail,
  Shield,
  FileText,
  Clock,
  Stethoscope
} from 'lucide-react';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface PriceTier {
  id: string;
  tier_name: string;
  tier_type: string;
}

interface QuickRegisterData {
  // Essential fields
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nricId: string;
  
  // Address information
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Additional details
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  medicalConditions: string;
  insuranceInfo: string;
  
  // Visit-specific
  visitReason: string;
  paymentMethod: string;
  urgencyLevel: 'normal' | 'urgent' | 'emergency';
  preferredDoctorId: string;
  
  // Photo
  photoFile: File | null;
  photoPreview: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Malacca', 'Negeri Sembilan', 'Pahang',
  'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
  'Federal Territory of Kuala Lumpur', 'Federal Territory of Labuan', 'Federal Territory of Putrajaya'
];

export function QuickRegisterForm() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();
  const { addToQueue } = useQueue();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<QuickRegisterData>({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nricId: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Malaysia',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    medicalConditions: '',
    insuranceInfo: '',
    visitReason: '',
    paymentMethod: '',
    urgencyLevel: 'normal',
    preferredDoctorId: '',
    photoFile: null,
    photoPreview: ''
  });

  useEffect(() => {
    fetchDoctors();
    fetchPriceTiers();
  }, []);

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

  const fetchPriceTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('price_tiers')
        .select('id, tier_name, tier_type')
        .order('tier_name');

      if (error) throw error;
      setPriceTiers(data || []);
    } catch (error) {
      console.error('Error fetching price tiers:', error);
    }
  };

  // NRIC validation and auto-population logic
  const validateMalaysianNRIC = (nric: string): boolean => {
    const nricRegex = /^\d{6}-\d{2}-\d{4}$/;
    return nricRegex.test(nric);
  };

  const extractDataFromNRIC = (nric: string) => {
    if (!validateMalaysianNRIC(nric)) return null;
    
    const cleanNric = nric.replace(/-/g, '');
    const yearPrefix = cleanNric.substring(0, 2);
    const month = cleanNric.substring(2, 4);
    const day = cleanNric.substring(4, 6);
    const genderDigit = parseInt(cleanNric.substring(11, 12));
    
    // Determine century (assuming years 00-30 are 2000s, 31-99 are 1900s)
    const year = parseInt(yearPrefix) <= 30 ? `20${yearPrefix}` : `19${yearPrefix}`;
    
    const dateOfBirth = `${year}-${month}-${day}`;
    const gender = genderDigit % 2 === 0 ? 'female' : 'male';
    
    return { dateOfBirth, gender };
  };

  const formatNRIC = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 6) return cleaned;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 12)}`;
  };

  const handleNRICChange = (value: string) => {
    const formatted = formatNRIC(value);
    
    setFormData(prev => ({ ...prev, nricId: formatted }));
    
    if (validateMalaysianNRIC(formatted)) {
      const extracted = extractDataFromNRIC(formatted);
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          dateOfBirth: extracted.dateOfBirth,
          gender: extracted.gender
        }));
        
        toast({
          title: "NRIC Validated",
          description: "Date of birth and gender auto-filled from NRIC",
        });
      }
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'Image size must be less than 2MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        photoFile: file,
        photoPreview: reader.result as string
      }));
    };
    reader.readAsDataURL(file);

    // Clear photo error
    setErrors(prev => ({ ...prev, photo: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Required fields validation
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.visitReason.trim()) newErrors.visitReason = 'Visit reason is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    // NRIC validation
    if (formData.nricId && !validateMalaysianNRIC(formData.nricId)) {
      newErrors.nricId = 'Invalid NRIC format (should be 123456-12-1234)';
    }

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Split name
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Generate patient ID
      const patientId = await generatePatientId();

      // Prepare address
      const fullAddress = [
        formData.streetAddress,
        formData.city,
        formData.state,
        formData.postalCode,
        formData.country
      ].filter(Boolean).join(', ');

      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          patient_id: patientId,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender.toLowerCase(),
          phone: formData.phone,
          email: formData.email || null,
          address: fullAddress || null,
          emergency_contact_name: formData.emergencyContactName || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          allergies: formData.allergies || null,
          medical_history: formData.medicalConditions || null,
          visit_reason: formData.visitReason,
          additional_notes: formData.nricId ? `NRIC: ${formData.nricId}` : null,
          created_by: profile?.id
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Add to queue
      await addToQueue(patient.id, formData.preferredDoctorId === "none" ? undefined : formData.preferredDoctorId);

      // Create registration activity
      await supabase
        .from('patient_activities')
        .insert({
          patient_id: patient.id,
          activity_type: 'registration',
          title: 'Quick Registration & Queue',
          content: `New patient registered via quick registration`,
          staff_member_id: profile?.id,
          metadata: {
            registration_type: 'quick',
            visit_reason: formData.visitReason,
            payment_method: formData.paymentMethod,
            urgency_level: formData.urgencyLevel,
            preferred_doctor: formData.preferredDoctorId,
            has_photo: !!formData.photoFile,
            insurance_info: formData.insuranceInfo
          }
        });

      toast({
        title: "Registration Successful",
        description: `${formData.fullName} has been registered and added to the queue`,
      });

      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        nricId: '',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Malaysia',
        email: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: '',
        medicalConditions: '',
        insuranceInfo: '',
        visitReason: '',
        paymentMethod: '',
        urgencyLevel: 'normal',
        preferredDoctorId: '',
        photoFile: null,
        photoPreview: ''
      });
      setShowMoreInfo(false);
      setErrors({});

    } catch (error) {
      console.error('Error registering patient:', error);
      toast({
        title: "Registration Error",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRequiredFieldsCount = () => {
    const requiredFields = ['fullName', 'phone', 'dateOfBirth', 'gender', 'visitReason', 'paymentMethod'];
    return requiredFields.filter(field => formData[field as keyof QuickRegisterData]).length;
  };

  const totalRequiredFields = 6;
  const completedRequiredFields = getRequiredFieldsCount();

  return (
    <div className="space-y-6">
      {/* Essential Fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
            <Badge variant={completedRequiredFields === totalRequiredFields ? "default" : "secondary"}>
              {completedRequiredFields}/{totalRequiredFields} Required Fields
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Full Name and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-1">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Date of Birth, Gender, NRIC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className={errors.dateOfBirth ? 'border-destructive' : ''}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-1">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.gender}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nricId">
                NRIC/ID <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="nricId"
                value={formData.nricId}
                onChange={(e) => handleNRICChange(e.target.value)}
                placeholder="NRIC or ID number"
                className={errors.nricId ? 'border-destructive' : ''}
              />
              {errors.nricId && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nricId}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Visit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visitReason" className="flex items-center gap-1">
              Reason for Visit <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="visitReason"
              value={formData.visitReason}
              onChange={(e) => setFormData(prev => ({ ...prev, visitReason: e.target.value }))}
              placeholder="Describe reason for today's visit"
              rows={2}
              className={errors.visitReason ? 'border-destructive' : ''}
            />
            {errors.visitReason && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.visitReason}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-1">
                Payment Method <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className={errors.paymentMethod ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="self_pay">Self Pay</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.paymentMethod}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredDoctor">
                Preferred Doctor <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Select 
                value={formData.preferredDoctorId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferredDoctorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="none">No preference</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-3">
            <Label>Urgency Level</Label>
            <div className="flex items-center space-x-6">
              {[
                { value: 'normal', label: 'Normal', color: 'bg-green-100 text-green-800' },
                { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
                { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={option.value}
                    checked={formData.urgencyLevel === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value as any }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable More Information Section */}
      <Collapsible open={showMoreInfo} onOpenChange={setShowMoreInfo}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Information
                  <Badge variant="outline">Optional</Badge>
                </CardTitle>
                {showMoreInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Patient Photo
                </Label>
                <div className="flex items-center space-x-4">
                  {formData.photoPreview ? (
                    <div className="relative">
                      <img
                        src={formData.photoPreview}
                        alt="Patient preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, photoFile: null, photoPreview: '' }))}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG up to 2MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4" />
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Textarea
                      id="streetAddress"
                      value={formData.streetAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                      placeholder="Enter street address"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select 
                      value={formData.state} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {MALAYSIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="Postal code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Medical Information */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 font-semibold">
                  <Mail className="h-4 w-4" />
                  Contact & Medical Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      placeholder="Emergency contact phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceInfo">Insurance/Panel Information</Label>
                    <Select 
                      value={formData.insuranceInfo} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, insuranceInfo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance type" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {priceTiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.tier_name} ({tier.tier_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                      placeholder="List any known allergies"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Textarea
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => setFormData(prev => ({ ...prev, medicalConditions: e.target.value }))}
                      placeholder="List any existing medical conditions"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={() => {
            setFormData({
              fullName: '',
              phone: '',
              dateOfBirth: '',
              gender: '',
              nricId: '',
              streetAddress: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'Malaysia',
              email: '',
              emergencyContactName: '',
              emergencyContactPhone: '',
              allergies: '',
              medicalConditions: '',
              insuranceInfo: '',
              visitReason: '',
              paymentMethod: '',
              urgencyLevel: 'normal',
              preferredDoctorId: '',
              photoFile: null,
              photoPreview: ''
            });
            setErrors({});
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => toast({ title: "Draft saved", description: "Form data has been saved as draft" })}
        >
          Save as Draft
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={loading || completedRequiredFields < totalRequiredFields}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            'Register & Add to Queue'
          )}
        </Button>
      </div>
    </div>
  );
}