export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string | null
          created_by: string | null
          doctor_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string | null
          created_by?: string | null
          doctor_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      billing: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string
          id: string
          invoice_number: string
          paid_date: string | null
          patient_id: string
          payment_method: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date: string
          id?: string
          invoice_number: string
          paid_date?: string | null
          patient_id: string
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string
          paid_date?: string | null
          patient_id?: string
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          created_at: string
          data_type: string
          description: string | null
          id: string
          is_encrypted: boolean | null
          is_required: boolean | null
          setting_category: string
          setting_key: string
          setting_value: string | null
          updated_at: string
          updated_by: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          data_type?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_required?: boolean | null
          setting_category: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          data_type?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_required?: boolean | null
          setting_category?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      consultation_files: {
        Row: {
          consultation_note_id: string | null
          consultation_session_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          uploaded_by: string
        }
        Insert: {
          consultation_note_id?: string | null
          consultation_session_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          uploaded_by: string
        }
        Update: {
          consultation_note_id?: string | null
          consultation_session_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_consultation_files_note"
            columns: ["consultation_note_id"]
            isOneToOne: false
            referencedRelation: "consultation_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_consultation_files_session"
            columns: ["consultation_session_id"]
            isOneToOne: false
            referencedRelation: "consultation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notes: {
        Row: {
          appointment_id: string
          chief_complaint: string | null
          created_at: string | null
          diagnosis: string | null
          doctor_id: string
          follow_up_instructions: string | null
          id: string
          patient_id: string
          prescriptions: string | null
          symptoms: string | null
          treatment_plan: string | null
          updated_at: string | null
          vital_signs: Json | null
        }
        Insert: {
          appointment_id: string
          chief_complaint?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id: string
          follow_up_instructions?: string | null
          id?: string
          patient_id: string
          prescriptions?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Update: {
          appointment_id?: string
          chief_complaint?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string
          follow_up_instructions?: string | null
          id?: string
          patient_id?: string
          prescriptions?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          paused_at: string | null
          queue_id: string | null
          started_at: string
          status: string
          total_duration_minutes: number | null
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          paused_at?: string | null
          queue_id?: string | null
          started_at?: string
          status?: string
          total_duration_minutes?: number | null
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          paused_at?: string | null
          queue_id?: string | null
          started_at?: string
          status?: string
          total_duration_minutes?: number | null
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      medical_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          preparation_notes: string | null
          price: number
          requires_equipment: boolean | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          preparation_notes?: string | null
          price: number
          requires_equipment?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          preparation_notes?: string | null
          price?: number
          requires_equipment?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      medication_pricing: {
        Row: {
          created_at: string
          id: string
          medication_id: string
          price: number
          tier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id: string
          price: number
          tier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string
          price?: number
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_pricing_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_pricing_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "price_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          brand_name: string | null
          category: string | null
          contraindications: string[] | null
          created_at: string
          dosage_forms: string[] | null
          generic_name: string | null
          id: string
          interactions: string[] | null
          name: string
          price_per_unit: number | null
          side_effects: string[] | null
          strength_options: string[] | null
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          category?: string | null
          contraindications?: string[] | null
          created_at?: string
          dosage_forms?: string[] | null
          generic_name?: string | null
          id?: string
          interactions?: string[] | null
          name: string
          price_per_unit?: number | null
          side_effects?: string[] | null
          strength_options?: string[] | null
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          category?: string | null
          contraindications?: string[] | null
          created_at?: string
          dosage_forms?: string[] | null
          generic_name?: string | null
          id?: string
          interactions?: string[] | null
          name?: string
          price_per_unit?: number | null
          side_effects?: string[] | null
          strength_options?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_activities: {
        Row: {
          activity_date: string
          activity_type: string
          content: string | null
          created_at: string
          id: string
          metadata: Json | null
          patient_id: string
          priority: string | null
          related_record_id: string | null
          staff_member_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          patient_id: string
          priority?: string | null
          related_record_id?: string | null
          staff_member_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          patient_id?: string
          priority?: string | null
          related_record_id?: string | null
          staff_member_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_current_medications: {
        Row: {
          created_at: string
          dosage: string | null
          duration_days: number | null
          frequency: string | null
          id: string
          medication_name: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          prescribed_date: string
          refill_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          prescribed_date: string
          refill_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          prescribed_date?: string
          refill_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_current_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_current_medications_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_queue: {
        Row: {
          assigned_doctor_id: string | null
          checked_in_at: string | null
          consultation_completed_at: string | null
          consultation_started_at: string | null
          created_at: string
          estimated_consultation_duration: number | null
          id: string
          patient_id: string
          queue_date: string
          queue_number: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_doctor_id?: string | null
          checked_in_at?: string | null
          consultation_completed_at?: string | null
          consultation_started_at?: string | null
          created_at?: string
          estimated_consultation_duration?: number | null
          id?: string
          patient_id: string
          queue_date?: string
          queue_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_doctor_id?: string | null
          checked_in_at?: string | null
          consultation_completed_at?: string | null
          consultation_started_at?: string | null
          created_at?: string
          estimated_consultation_duration?: number | null
          id?: string
          patient_id?: string
          queue_date?: string
          queue_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          additional_notes: string | null
          address: string | null
          allergies: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          medical_history: string | null
          patient_id: string | null
          phone: string | null
          preferred_name: string | null
          referral_source: string | null
          secondary_phone: string | null
          updated_at: string | null
          visit_reason: string | null
        }
        Insert: {
          additional_notes?: string | null
          address?: string | null
          allergies?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          medical_history?: string | null
          patient_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          referral_source?: string | null
          secondary_phone?: string | null
          updated_at?: string | null
          visit_reason?: string | null
        }
        Update: {
          additional_notes?: string | null
          address?: string | null
          allergies?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          medical_history?: string | null
          patient_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          referral_source?: string | null
          secondary_phone?: string | null
          updated_at?: string | null
          visit_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tiers: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          invitation_status: string | null
          invited_at: string | null
          invited_by: string | null
          last_login_at: string | null
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          id: string
          invitation_status?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          invitation_status?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pricing: {
        Row: {
          created_at: string
          id: string
          price: number
          service_id: string
          tier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          service_id: string
          tier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          service_id?: string
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "medical_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_pricing_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "price_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_items: {
        Row: {
          consultation_note_id: string | null
          consultation_session_id: string
          created_at: string
          dosage_instructions: string | null
          duration_days: number | null
          frequency: string | null
          id: string
          item_type: string
          medication_id: string | null
          notes: string | null
          quantity: number | null
          rate: number
          service_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          consultation_note_id?: string | null
          consultation_session_id: string
          created_at?: string
          dosage_instructions?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          item_type: string
          medication_id?: string | null
          notes?: string | null
          quantity?: number | null
          rate: number
          service_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          consultation_note_id?: string | null
          consultation_session_id?: string
          created_at?: string
          dosage_instructions?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          item_type?: string
          medication_id?: string | null
          notes?: string | null
          quantity?: number | null
          rate?: number
          service_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_treatment_items_consultation_note"
            columns: ["consultation_note_id"]
            isOneToOne: false
            referencedRelation: "consultation_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_treatment_items_consultation_session"
            columns: ["consultation_session_id"]
            isOneToOne: false
            referencedRelation: "consultation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_treatment_items_medication"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_treatment_items_service"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "medical_services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_queue_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      payment_method_type:
        | "Self-Pay"
        | "Insurance"
        | "Corporate"
        | "Government Panel"
      user_role: "admin" | "doctor" | "nurse" | "receptionist"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method_type: [
        "Self-Pay",
        "Insurance",
        "Corporate",
        "Government Panel",
      ],
      user_role: ["admin", "doctor", "nurse", "receptionist"],
    },
  },
} as const
