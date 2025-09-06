-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist');

-- Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'receptionist',
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    phone TEXT,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_history TEXT,
    allergies TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create consultation notes table
CREATE TABLE public.consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id),
    chief_complaint TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescriptions TEXT,
    follow_up_instructions TEXT,
    vital_signs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create billing table
CREATE TABLE public.billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id),
    invoice_number TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create helper function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = required_role
    );
$$;

-- Create helper function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles user_role[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = ANY(required_roles)
    );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (has_role('admin'));

CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE TO authenticated USING (has_role('admin'));

-- RLS Policies for patients
CREATE POLICY "All staff can view patients" ON public.patients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Receptionists and above can create patients" ON public.patients
    FOR INSERT TO authenticated WITH CHECK (has_any_role(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

CREATE POLICY "All staff can update patients" ON public.patients
    FOR UPDATE TO authenticated USING (has_any_role(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

CREATE POLICY "Admins can delete patients" ON public.patients
    FOR DELETE TO authenticated USING (has_role('admin'));

-- RLS Policies for appointments
CREATE POLICY "All staff can view appointments" ON public.appointments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can create appointments" ON public.appointments
    FOR INSERT TO authenticated WITH CHECK (has_any_role(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

CREATE POLICY "Staff can update appointments" ON public.appointments
    FOR UPDATE TO authenticated USING (has_any_role(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

CREATE POLICY "Admins can delete appointments" ON public.appointments
    FOR DELETE TO authenticated USING (has_role('admin'));

-- RLS Policies for consultation notes
CREATE POLICY "Doctors and admins can view consultation notes" ON public.consultation_notes
    FOR SELECT TO authenticated USING (has_any_role(ARRAY['admin', 'doctor']) OR doctor_id = auth.uid());

CREATE POLICY "Doctors can create consultation notes" ON public.consultation_notes
    FOR INSERT TO authenticated WITH CHECK (has_any_role(ARRAY['admin', 'doctor']));

CREATE POLICY "Doctors can update their own consultation notes" ON public.consultation_notes
    FOR UPDATE TO authenticated USING (doctor_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Admins can delete consultation notes" ON public.consultation_notes
    FOR DELETE TO authenticated USING (has_role('admin'));

-- RLS Policies for billing
CREATE POLICY "All staff can view billing" ON public.billing
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Receptionists and above can create billing" ON public.billing
    FOR INSERT TO authenticated WITH CHECK (has_any_role(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

CREATE POLICY "Receptionists and above can update billing" ON public.billing
    FOR UPDATE TO authenticated USING (has_any_role(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

CREATE POLICY "Admins can delete billing" ON public.billing
    FOR DELETE TO authenticated USING (has_role('admin'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_notes_updated_at
    BEFORE UPDATE ON public.consultation_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_updated_at
    BEFORE UPDATE ON public.billing
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate unique invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;