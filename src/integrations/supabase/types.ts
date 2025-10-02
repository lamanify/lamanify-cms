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
      appointment_check_in_links: {
        Row: {
          appointment_id: string
          check_in_completed: boolean | null
          created_at: string
          expires_at: string
          forms_completed: boolean | null
          id: string
          patient_id: string
          secure_token: string
          used_at: string | null
        }
        Insert: {
          appointment_id: string
          check_in_completed?: boolean | null
          created_at?: string
          expires_at: string
          forms_completed?: boolean | null
          id?: string
          patient_id: string
          secure_token: string
          used_at?: string | null
        }
        Update: {
          appointment_id?: string
          check_in_completed?: boolean | null
          created_at?: string
          expires_at?: string
          forms_completed?: boolean | null
          id?: string
          patient_id?: string
          secure_token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      appointment_resources: {
        Row: {
          appointment_id: string
          created_at: string | null
          id: string
          resource_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          id?: string
          resource_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          id?: string
          resource_id?: string
        }
        Relationships: []
      }
      appointment_waitlist: {
        Row: {
          contact_preference: string | null
          created_at: string | null
          created_by: string | null
          doctor_id: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          preferred_date_end: string | null
          preferred_date_start: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          priority: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_preference?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          preferred_date_end?: string | null
          preferred_date_start?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_preference?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          preferred_date_end?: string | null
          preferred_date_start?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          cancellation_fee: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          created_by: string | null
          digital_check_in_status: string | null
          doctor_id: string
          duration_minutes: number | null
          follow_up_scheduled: boolean | null
          id: string
          is_series_parent: boolean | null
          no_show_marked_at: string | null
          notes: string | null
          occurrence_number: number | null
          patient_id: string
          reason: string | null
          recurrence_end_date: string | null
          recurrence_id: string | null
          recurrence_pattern: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by?: string | null
          digital_check_in_status?: string | null
          doctor_id: string
          duration_minutes?: number | null
          follow_up_scheduled?: boolean | null
          id?: string
          is_series_parent?: boolean | null
          no_show_marked_at?: string | null
          notes?: string | null
          occurrence_number?: number | null
          patient_id: string
          reason?: string | null
          recurrence_end_date?: string | null
          recurrence_id?: string | null
          recurrence_pattern?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by?: string | null
          digital_check_in_status?: string | null
          doctor_id?: string
          duration_minutes?: number | null
          follow_up_scheduled?: boolean | null
          id?: string
          is_series_parent?: boolean | null
          no_show_marked_at?: string | null
          notes?: string | null
          occurrence_number?: number | null
          patient_id?: string
          reason?: string | null
          recurrence_end_date?: string | null
          recurrence_id?: string | null
          recurrence_pattern?: Json | null
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
          billing_party_snapshot: Json | null
          claim_notes: string | null
          claim_number: string | null
          claim_status: string | null
          claim_submitted_by: string | null
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string
          id: string
          invoice_number: string
          paid_date: string | null
          panel_id: string | null
          panel_reference_number: string | null
          patient_id: string
          payment_method: string | null
          relationship_to_patient: string | null
          staff_ic_passport: string | null
          staff_name: string | null
          status: string | null
          submission_date: string | null
          updated_at: string | null
          visit_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          billing_party_snapshot?: Json | null
          claim_notes?: string | null
          claim_number?: string | null
          claim_status?: string | null
          claim_submitted_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date: string
          id?: string
          invoice_number: string
          paid_date?: string | null
          panel_id?: string | null
          panel_reference_number?: string | null
          patient_id: string
          payment_method?: string | null
          relationship_to_patient?: string | null
          staff_ic_passport?: string | null
          staff_name?: string | null
          status?: string | null
          submission_date?: string | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          billing_party_snapshot?: Json | null
          claim_notes?: string | null
          claim_number?: string | null
          claim_status?: string | null
          claim_submitted_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string
          paid_date?: string | null
          panel_id?: string | null
          panel_reference_number?: string | null
          patient_id?: string
          payment_method?: string | null
          relationship_to_patient?: string | null
          staff_ic_passport?: string | null
          staff_name?: string | null
          status?: string | null
          submission_date?: string | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_claim_submitted_by_fkey"
            columns: ["claim_submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "billing_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policies: {
        Row: {
          auto_restriction_enabled: boolean | null
          cancellation_window_hours: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          late_cancellation_fee: number | null
          max_no_shows_before_restriction: number | null
          no_show_fee: number | null
          policy_name: string
          restriction_duration_days: number | null
          updated_at: string
        }
        Insert: {
          auto_restriction_enabled?: boolean | null
          cancellation_window_hours?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          late_cancellation_fee?: number | null
          max_no_shows_before_restriction?: number | null
          no_show_fee?: number | null
          policy_name: string
          restriction_duration_days?: number | null
          updated_at?: string
        }
        Update: {
          auto_restriction_enabled?: boolean | null
          cancellation_window_hours?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          late_cancellation_fee?: number | null
          max_no_shows_before_restriction?: number | null
          no_show_fee?: number | null
          policy_name?: string
          restriction_duration_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      clinic_header_settings: {
        Row: {
          address: string | null
          clinic_name: string
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
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
      communication_templates: {
        Row: {
          content_template: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          subject_template: string
          template_name: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content_template: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          subject_template: string
          template_name: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content_template?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          subject_template?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      compliance_settings: {
        Row: {
          country_code: string
          created_at: string
          description: string | null
          id: string
          is_encrypted: boolean | null
          setting_category: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          setting_category: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          setting_category?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_submissions: {
        Row: {
          api_response: Json | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_details: Json | null
          failed_submissions: number | null
          id: string
          invoice_ids: string[] | null
          next_retry_at: string | null
          retry_count: number | null
          submission_batch_id: string | null
          submission_data: Json | null
          submission_status: string
          submission_type: string
          submitted_at: string | null
          successful_submissions: number | null
          total_invoices: number
        }
        Insert: {
          api_response?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          failed_submissions?: number | null
          id?: string
          invoice_ids?: string[] | null
          next_retry_at?: string | null
          retry_count?: number | null
          submission_batch_id?: string | null
          submission_data?: Json | null
          submission_status?: string
          submission_type: string
          submitted_at?: string | null
          successful_submissions?: number | null
          total_invoices?: number
        }
        Update: {
          api_response?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          failed_submissions?: number | null
          id?: string
          invoice_ids?: string[] | null
          next_retry_at?: string | null
          retry_count?: number | null
          submission_batch_id?: string | null
          submission_data?: Json | null
          submission_status?: string
          submission_type?: string
          submitted_at?: string | null
          successful_submissions?: number | null
          total_invoices?: number
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
      digital_signatures: {
        Row: {
          certificate_info: Json | null
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          is_valid: boolean | null
          signature_data: string
          signature_type: string
          signing_timestamp: string
          validation_details: Json | null
        }
        Insert: {
          certificate_info?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          is_valid?: boolean | null
          signature_data: string
          signature_type: string
          signing_timestamp?: string
          validation_details?: Json | null
        }
        Update: {
          certificate_info?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          is_valid?: boolean | null
          signature_data?: string
          signature_type?: string
          signing_timestamp?: string
          validation_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_signature_einvoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "e_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          price_from: number | null
          price_to: number | null
          status: string | null
          template_name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          price_from?: number | null
          price_to?: number | null
          status?: string | null
          template_name: string
          template_type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          price_from?: number | null
          price_to?: number | null
          status?: string | null
          template_name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      e_invoice_templates: {
        Row: {
          compliance_country: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          template_content: Json
          template_name: string
          template_type: string
          template_version: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          compliance_country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          template_content?: Json
          template_name: string
          template_type: string
          template_version?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          compliance_country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          template_content?: Json
          template_name?: string
          template_type?: string
          template_version?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      e_invoices: {
        Row: {
          compliance_status: string
          created_at: string
          created_by: string | null
          digital_signature: Json | null
          id: string
          invoice_data: Json
          invoice_id: string
          lhdn_response: Json | null
          qr_code_data: string | null
          qr_code_url: string | null
          submission_date: string | null
          submission_id: string | null
          template_id: string | null
          uin: string
          updated_at: string
          validation_errors: Json | null
        }
        Insert: {
          compliance_status?: string
          created_at?: string
          created_by?: string | null
          digital_signature?: Json | null
          id?: string
          invoice_data?: Json
          invoice_id: string
          lhdn_response?: Json | null
          qr_code_data?: string | null
          qr_code_url?: string | null
          submission_date?: string | null
          submission_id?: string | null
          template_id?: string | null
          uin: string
          updated_at?: string
          validation_errors?: Json | null
        }
        Update: {
          compliance_status?: string
          created_at?: string
          created_by?: string | null
          digital_signature?: Json | null
          id?: string
          invoice_data?: Json
          invoice_id?: string
          lhdn_response?: Json | null
          qr_code_data?: string | null
          qr_code_url?: string | null
          submission_date?: string | null
          submission_id?: string | null
          template_id?: string | null
          uin?: string
          updated_at?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_einvoice_billing"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_einvoice_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "e_invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_campaigns: {
        Row: {
          appointment_duration_minutes: number | null
          appointment_reason: string | null
          campaign_name: string
          created_at: string
          created_by: string | null
          follow_up_days: number
          follow_up_type: string
          id: string
          is_active: boolean | null
          message_template: string | null
          trigger_condition: string
          trigger_criteria: Json | null
          updated_at: string
        }
        Insert: {
          appointment_duration_minutes?: number | null
          appointment_reason?: string | null
          campaign_name: string
          created_at?: string
          created_by?: string | null
          follow_up_days: number
          follow_up_type: string
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          trigger_condition: string
          trigger_criteria?: Json | null
          updated_at?: string
        }
        Update: {
          appointment_duration_minutes?: number | null
          appointment_reason?: string | null
          campaign_name?: string
          created_at?: string
          created_by?: string | null
          follow_up_days?: number
          follow_up_type?: string
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          trigger_condition?: string
          trigger_criteria?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      integration_configs: {
        Row: {
          api_key_encrypted: string
          api_key_last4: string
          authentication_type: string
          created_at: string | null
          created_by: string | null
          endpoint_url: string
          error_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          provider: string
          retry_attempts: number | null
          success_count: number | null
          timeout_seconds: number | null
          updated_at: string | null
          webhook_secret_last4: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key_encrypted: string
          api_key_last4: string
          authentication_type?: string
          created_at?: string | null
          created_by?: string | null
          endpoint_url: string
          error_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          provider: string
          retry_attempts?: number | null
          success_count?: number | null
          timeout_seconds?: number | null
          updated_at?: string | null
          webhook_secret_last4?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key_encrypted?: string
          api_key_last4?: string
          authentication_type?: string
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string
          error_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          provider?: string
          retry_attempts?: number | null
          success_count?: number | null
          timeout_seconds?: number | null
          updated_at?: string | null
          webhook_secret_last4?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      medical_services: {
        Row: {
          category: string
          cost_price: number | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          preparation_notes: string | null
          price: number
          requires_equipment: boolean | null
          service_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          preparation_notes?: string | null
          price: number
          requires_equipment?: boolean | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          preparation_notes?: string | null
          price?: number
          requires_equipment?: boolean | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medication_dosage_templates: {
        Row: {
          created_at: string | null
          dispense_quantity: number | null
          dosage_amount: number | null
          dosage_unit: string | null
          duration_unit: string | null
          duration_value: number | null
          frequency: string | null
          id: string
          indication: string | null
          instruction: string | null
          medication_id: string
          precaution: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dispense_quantity?: number | null
          dosage_amount?: number | null
          dosage_unit?: string | null
          duration_unit?: string | null
          duration_value?: number | null
          frequency?: string | null
          id?: string
          indication?: string | null
          instruction?: string | null
          medication_id: string
          precaution?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dispense_quantity?: number | null
          dosage_amount?: number | null
          dosage_unit?: string | null
          duration_unit?: string | null
          duration_value?: number | null
          frequency?: string | null
          id?: string
          indication?: string | null
          instruction?: string | null
          medication_id?: string
          precaution?: string | null
          updated_at?: string | null
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
          average_cost: number | null
          brand_name: string | null
          category: string | null
          contraindications: string[] | null
          cost_price: number | null
          created_at: string
          dosage_forms: string[] | null
          enable_dosage_settings: boolean | null
          generic_name: string | null
          groups: string[] | null
          id: string
          interactions: string[] | null
          name: string
          price_per_unit: number | null
          remarks: string | null
          side_effects: string[] | null
          stock_level: number | null
          strength_options: string[] | null
          unit_of_measure: string | null
          updated_at: string
        }
        Insert: {
          average_cost?: number | null
          brand_name?: string | null
          category?: string | null
          contraindications?: string[] | null
          cost_price?: number | null
          created_at?: string
          dosage_forms?: string[] | null
          enable_dosage_settings?: boolean | null
          generic_name?: string | null
          groups?: string[] | null
          id?: string
          interactions?: string[] | null
          name: string
          price_per_unit?: number | null
          remarks?: string | null
          side_effects?: string[] | null
          stock_level?: number | null
          strength_options?: string[] | null
          unit_of_measure?: string | null
          updated_at?: string
        }
        Update: {
          average_cost?: number | null
          brand_name?: string | null
          category?: string | null
          contraindications?: string[] | null
          cost_price?: number | null
          created_at?: string
          dosage_forms?: string[] | null
          enable_dosage_settings?: boolean | null
          generic_name?: string | null
          groups?: string[] | null
          id?: string
          interactions?: string[] | null
          name?: string
          price_per_unit?: number | null
          remarks?: string | null
          side_effects?: string[] | null
          stock_level?: number | null
          strength_options?: string[] | null
          unit_of_measure?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      package_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          package_id: string
          quantity: number
          stock_at_time_added: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          package_id: string
          quantity?: number
          stock_at_time_added?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          package_id?: string
          quantity?: number
          stock_at_time_added?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      packages: {
        Row: {
          bundle_value: number
          created_at: string | null
          created_by: string | null
          discount_percentage: number | null
          id: string
          package_name: string
          package_price: number
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bundle_value: number
          created_at?: string | null
          created_by?: string | null
          discount_percentage?: number | null
          id?: string
          package_name: string
          package_price: number
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bundle_value?: number
          created_at?: string | null
          created_by?: string | null
          discount_percentage?: number | null
          id?: string
          package_name?: string
          package_price?: number
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      panel_claim_documents: {
        Row: {
          claim_id: string
          created_at: string
          description: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          is_required: boolean
          mime_type: string | null
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          claim_id: string
          created_at?: string
          description?: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          is_required?: boolean
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          claim_id?: string
          created_at?: string
          description?: string | null
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_required?: boolean
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "panel_claim_documents_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "panel_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claim_items: {
        Row: {
          billing_id: string
          claim_amount: number
          claim_id: string
          created_at: string
          id: string
          item_amount: number
          rejection_reason: string | null
          status: string
        }
        Insert: {
          billing_id: string
          claim_amount: number
          claim_id: string
          created_at?: string
          id?: string
          item_amount: number
          rejection_reason?: string | null
          status?: string
        }
        Update: {
          billing_id?: string
          claim_amount?: number
          claim_id?: string
          created_at?: string
          id?: string
          item_amount?: number
          rejection_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "panel_claim_items_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panel_claim_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "panel_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claim_notes: {
        Row: {
          claim_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_system_generated: boolean
          metadata: Json | null
          note_category: string
          parent_note_id: string | null
          priority: string
          updated_at: string
          updated_by: string | null
          visibility: string
        }
        Insert: {
          claim_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_system_generated?: boolean
          metadata?: Json | null
          note_category: string
          parent_note_id?: string | null
          priority?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Update: {
          claim_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_system_generated?: boolean
          metadata?: Json | null
          note_category?: string
          parent_note_id?: string | null
          priority?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "panel_claim_notes_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "panel_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panel_claim_notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "panel_claim_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billing_period_end: string
          billing_period_start: string
          claim_number: string
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          panel_id: string
          panel_reference_number: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          total_amount: number
          total_items: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billing_period_end: string
          billing_period_start: string
          claim_number: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          panel_id: string
          panel_reference_number?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_amount?: number
          total_items?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billing_period_end?: string
          billing_period_start?: string
          claim_number?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          panel_id?: string
          panel_reference_number?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_amount?: number
          total_items?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "panel_claims_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panel_claims_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panel_claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims_approval_requests: {
        Row: {
          approval_notes: string | null
          approved_by: string | null
          claim_id: string
          escalated_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          rejection_reason: string | null
          request_amount: number
          requested_at: string
          requested_by: string | null
          responded_at: string | null
          status: string
          workflow_id: string
        }
        Insert: {
          approval_notes?: string | null
          approved_by?: string | null
          claim_id: string
          escalated_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          request_amount: number
          requested_at?: string
          requested_by?: string | null
          responded_at?: string | null
          status?: string
          workflow_id: string
        }
        Update: {
          approval_notes?: string | null
          approved_by?: string | null
          claim_id?: string
          escalated_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          request_amount?: number
          requested_at?: string
          requested_by?: string | null
          responded_at?: string | null
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "panel_claims_approval_requests_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "panel_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panel_claims_approval_requests_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "panel_claims_approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims_approval_workflows: {
        Row: {
          approval_order: number
          approval_timeout_hours: number | null
          auto_approve: boolean
          created_at: string
          created_by: string | null
          escalation_role: Database["public"]["Enums"]["user_role"] | null
          id: string
          is_active: boolean
          max_approval_amount: number | null
          min_approval_amount: number
          panel_id: string | null
          required_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          workflow_name: string
        }
        Insert: {
          approval_order?: number
          approval_timeout_hours?: number | null
          auto_approve?: boolean
          created_at?: string
          created_by?: string | null
          escalation_role?: Database["public"]["Enums"]["user_role"] | null
          id?: string
          is_active?: boolean
          max_approval_amount?: number | null
          min_approval_amount?: number
          panel_id?: string | null
          required_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          workflow_name: string
        }
        Update: {
          approval_order?: number
          approval_timeout_hours?: number | null
          auto_approve?: boolean
          created_at?: string
          created_by?: string | null
          escalation_role?: Database["public"]["Enums"]["user_role"] | null
          id?: string
          is_active?: boolean
          max_approval_amount?: number | null
          min_approval_amount?: number
          panel_id?: string | null
          required_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "panel_claims_approval_workflows_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims_audit: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          claim_id: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_data: Json | null
          new_status: string
          previous_data: Json | null
          previous_status: string | null
          user_agent: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          claim_id: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_data?: Json | null
          new_status: string
          previous_data?: Json | null
          previous_status?: string | null
          user_agent?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          claim_id?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_data?: Json | null
          new_status?: string
          previous_data?: Json | null
          previous_status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panel_claims_audit_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "panel_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims_notifications: {
        Row: {
          claim_id: string | null
          created_at: string
          failed_reason: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          recipient_email: string | null
          recipient_phone: string | null
          recipient_type: string
          retry_count: number | null
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          claim_id?: string | null
          created_at?: string
          failed_reason?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_type: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          claim_id?: string | null
          created_at?: string
          failed_reason?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_type?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panel_claims_notifications_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "panel_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims_reconciliation: {
        Row: {
          claim_amount: number
          claim_id: string
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          received_amount: number
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_date: string
          reconciliation_status: string
          rejection_reason: string | null
          updated_at: string
          variance_amount: number | null
          variance_percentage: number | null
          variance_type: string
        }
        Insert: {
          claim_amount?: number
          claim_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          received_amount?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_date?: string
          reconciliation_status?: string
          rejection_reason?: string | null
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
          variance_type?: string
        }
        Update: {
          claim_amount?: number
          claim_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          received_amount?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_date?: string
          reconciliation_status?: string
          rejection_reason?: string | null
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
          variance_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reconciliation_claim"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "panel_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims_scheduled_reports: {
        Row: {
          created_at: string
          created_by: string | null
          date_range_days: number
          id: string
          is_active: boolean
          last_generated_at: string | null
          next_generation_at: string | null
          panel_filters: string[] | null
          recipients: string[]
          report_name: string
          report_template: Json | null
          report_type: string
          schedule_day: number | null
          schedule_frequency: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_range_days?: number
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          next_generation_at?: string | null
          panel_filters?: string[] | null
          recipients: string[]
          report_name: string
          report_template?: Json | null
          report_type: string
          schedule_day?: number | null
          schedule_frequency: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_range_days?: number
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          next_generation_at?: string | null
          panel_filters?: string[] | null
          recipients?: string[]
          report_name?: string
          report_template?: Json | null
          report_type?: string
          schedule_day?: number | null
          schedule_frequency?: string
          updated_at?: string
        }
        Relationships: []
      }
      panel_claims_schedules: {
        Row: {
          auto_submit: boolean
          billing_period_days: number
          created_at: string
          created_by: string | null
          day_of_period: number | null
          frequency: string
          id: string
          is_active: boolean
          last_generated_at: string | null
          next_generation_at: string | null
          panel_id: string
          schedule_name: string
          template_settings: Json | null
          updated_at: string
        }
        Insert: {
          auto_submit?: boolean
          billing_period_days?: number
          created_at?: string
          created_by?: string | null
          day_of_period?: number | null
          frequency: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          next_generation_at?: string | null
          panel_id: string
          schedule_name: string
          template_settings?: Json | null
          updated_at?: string
        }
        Update: {
          auto_submit?: boolean
          billing_period_days?: number
          created_at?: string
          created_by?: string | null
          day_of_period?: number | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          next_generation_at?: string | null
          panel_id?: string
          schedule_name?: string
          template_settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "panel_claims_schedules_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_claims_status_rules: {
        Row: {
          auto_execute: boolean
          created_at: string
          delay_hours: number | null
          from_status: string
          id: string
          is_active: boolean
          notification_enabled: boolean
          rule_name: string
          to_status: string
          trigger_condition: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          auto_execute?: boolean
          created_at?: string
          delay_hours?: number | null
          from_status: string
          id?: string
          is_active?: boolean
          notification_enabled?: boolean
          rule_name: string
          to_status: string
          trigger_condition?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          auto_execute?: boolean
          created_at?: string
          delay_hours?: number | null
          from_status?: string
          id?: string
          is_active?: boolean
          notification_enabled?: boolean
          rule_name?: string
          to_status?: string
          trigger_condition?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      panels: {
        Row: {
          created_at: string
          created_by: string | null
          default_status: string | null
          id: string
          manual_remarks: string | null
          panel_code: string
          panel_name: string
          person_in_charge_name: string | null
          person_in_charge_phone: string | null
          updated_at: string
          verification_method: string | null
          verification_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_status?: string | null
          id?: string
          manual_remarks?: string | null
          panel_code: string
          panel_name: string
          person_in_charge_name?: string | null
          person_in_charge_phone?: string | null
          updated_at?: string
          verification_method?: string | null
          verification_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_status?: string | null
          id?: string
          manual_remarks?: string | null
          panel_code?: string
          panel_name?: string
          person_in_charge_name?: string | null
          person_in_charge_phone?: string | null
          updated_at?: string
          verification_method?: string | null
          verification_url?: string | null
        }
        Relationships: []
      }
      panels_price_tiers: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_until: string | null
          id: string
          is_default_tier: boolean | null
          panel_id: string
          priority_order: number | null
          tier_id: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_default_tier?: boolean | null
          panel_id: string
          priority_order?: number | null
          tier_id: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_default_tier?: boolean | null
          panel_id?: string
          priority_order?: number | null
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "panels_price_tiers_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panels_price_tiers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "price_tiers"
            referencedColumns: ["id"]
          },
        ]
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
      patient_form_submissions: {
        Row: {
          appointment_id: string
          form_data: Json
          form_id: string
          id: string
          ip_address: unknown | null
          patient_id: string
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          appointment_id: string
          form_data: Json
          form_id: string
          id?: string
          ip_address?: unknown | null
          patient_id: string
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          appointment_id?: string
          form_data?: Json
          form_id?: string
          id?: string
          ip_address?: unknown | null
          patient_id?: string
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "pre_consultation_forms"
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
          priority_rank: number | null
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
          priority_rank?: number | null
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
          priority_rank?: number | null
          queue_date?: string
          queue_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_queue_assigned_doctor_id"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_patient_queue_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_reliability_scores: {
        Row: {
          completed_appointments: number | null
          created_at: string
          id: string
          last_no_show_date: string | null
          late_cancellations: number | null
          no_shows: number | null
          on_time_arrivals: number | null
          patient_id: string
          reliability_score: number | null
          restriction_active: boolean | null
          restriction_end_date: string | null
          risk_level: string | null
          total_appointments: number | null
          updated_at: string
        }
        Insert: {
          completed_appointments?: number | null
          created_at?: string
          id?: string
          last_no_show_date?: string | null
          late_cancellations?: number | null
          no_shows?: number | null
          on_time_arrivals?: number | null
          patient_id: string
          reliability_score?: number | null
          restriction_active?: boolean | null
          restriction_end_date?: string | null
          risk_level?: string | null
          total_appointments?: number | null
          updated_at?: string
        }
        Update: {
          completed_appointments?: number | null
          created_at?: string
          id?: string
          last_no_show_date?: string | null
          late_cancellations?: number | null
          no_shows?: number | null
          on_time_arrivals?: number | null
          patient_id?: string
          reliability_score?: number | null
          restriction_active?: boolean | null
          restriction_end_date?: string | null
          risk_level?: string | null
          total_appointments?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_visits: {
        Row: {
          amount_paid: number | null
          created_at: string
          doctor_id: string | null
          id: string
          patient_id: string
          payment_status: string | null
          queue_id: string
          session_data: Json
          total_amount: number | null
          total_paid: number | null
          updated_at: string
          visit_date: string
          visit_summary: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id: string
          payment_status?: string | null
          queue_id: string
          session_data?: Json
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string
          visit_date?: string
          visit_summary?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id?: string
          payment_status?: string | null
          queue_id?: string
          session_data?: Json
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string
          visit_date?: string
          visit_summary?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          additional_notes: string | null
          address: string | null
          allergies: string | null
          assigned_tier_id: string | null
          avatar_url: string | null
          birth_cert: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          insurance_info: string | null
          last_name: string
          medical_history: string | null
          nric: string | null
          passport: string | null
          patient_id: string | null
          phone: string | null
          postal_code: string | null
          preferred_name: string | null
          referral_source: string | null
          reliability_score: number | null
          restriction_active: boolean | null
          restriction_end_date: string | null
          restriction_reason: string | null
          risk_level: string | null
          secondary_phone: string | null
          state: string | null
          street_address: string | null
          tier_assigned_at: string | null
          tier_assigned_by: string | null
          updated_at: string | null
          urgency_level: string | null
          visit_reason: string | null
        }
        Insert: {
          additional_notes?: string | null
          address?: string | null
          allergies?: string | null
          assigned_tier_id?: string | null
          avatar_url?: string | null
          birth_cert?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          insurance_info?: string | null
          last_name: string
          medical_history?: string | null
          nric?: string | null
          passport?: string | null
          patient_id?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          referral_source?: string | null
          reliability_score?: number | null
          restriction_active?: boolean | null
          restriction_end_date?: string | null
          restriction_reason?: string | null
          risk_level?: string | null
          secondary_phone?: string | null
          state?: string | null
          street_address?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          visit_reason?: string | null
        }
        Update: {
          additional_notes?: string | null
          address?: string | null
          allergies?: string | null
          assigned_tier_id?: string | null
          avatar_url?: string | null
          birth_cert?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          insurance_info?: string | null
          last_name?: string
          medical_history?: string | null
          nric?: string | null
          passport?: string | null
          patient_id?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          referral_source?: string | null
          reliability_score?: number | null
          restriction_active?: boolean | null
          restriction_end_date?: string | null
          restriction_reason?: string | null
          risk_level?: string | null
          secondary_phone?: string | null
          state?: string | null
          street_address?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          visit_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_assigned_tier_id_fkey"
            columns: ["assigned_tier_id"]
            isOneToOne: false
            referencedRelation: "price_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          metadata: Json | null
          notes: string | null
          patient_id: string
          payment_date: string
          payment_method: string
          processed_by: string | null
          reference_number: string | null
          status: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          patient_id: string
          payment_date?: string
          payment_method?: string
          processed_by?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string
          processed_by?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      po_approval_workflows: {
        Row: {
          approval_sequence: number
          auto_approve_below_threshold: boolean | null
          created_at: string
          created_by: string | null
          department: string | null
          escalation_hours: number | null
          id: string
          is_active: boolean | null
          max_order_value: number | null
          min_order_value: number
          notification_emails: string[] | null
          required_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          workflow_name: string
        }
        Insert: {
          approval_sequence?: number
          auto_approve_below_threshold?: boolean | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          escalation_hours?: number | null
          id?: string
          is_active?: boolean | null
          max_order_value?: number | null
          min_order_value?: number
          notification_emails?: string[] | null
          required_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          workflow_name: string
        }
        Update: {
          approval_sequence?: number
          auto_approve_below_threshold?: boolean | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          escalation_hours?: number | null
          id?: string
          is_active?: boolean | null
          max_order_value?: number | null
          min_order_value?: number
          notification_emails?: string[] | null
          required_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      po_templates: {
        Row: {
          auto_generate_day: number | null
          auto_generate_frequency: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          next_generation_date: string | null
          supplier_id: string
          template_data: Json
          template_name: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          auto_generate_day?: number | null
          auto_generate_frequency?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          next_generation_date?: string | null
          supplier_id: string
          template_data?: Json
          template_name: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          auto_generate_day?: number | null
          auto_generate_frequency?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          next_generation_date?: string | null
          supplier_id?: string
          template_data?: Json
          template_name?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "po_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_templates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_consultation_forms: {
        Row: {
          appointment_types: string[] | null
          created_at: string
          created_by: string | null
          form_description: string | null
          form_fields: Json
          form_name: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          updated_at: string
        }
        Insert: {
          appointment_types?: string[] | null
          created_at?: string
          created_by?: string | null
          form_description?: string | null
          form_fields: Json
          form_name: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          updated_at?: string
        }
        Update: {
          appointment_types?: string[] | null
          created_at?: string
          created_by?: string | null
          form_description?: string | null
          form_fields?: Json
          form_name?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          coverage_rules: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          eligibility_rules: Json | null
          id: string
          is_default_for_panel: boolean | null
          max_claim_amount: number | null
          requires_verification: boolean | null
          tier_name: string
          tier_type: string | null
          updated_at: string
        }
        Insert: {
          coverage_rules?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility_rules?: Json | null
          id?: string
          is_default_for_panel?: boolean | null
          max_claim_amount?: number | null
          requires_verification?: boolean | null
          tier_name: string
          tier_type?: string | null
          updated_at?: string
        }
        Update: {
          coverage_rules?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility_rules?: Json | null
          id?: string
          is_default_for_panel?: boolean | null
          max_claim_amount?: number | null
          requires_verification?: boolean | null
          tier_name?: string
          tier_type?: string | null
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
      purchase_order_audit: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          metadata: Json | null
          new_data: Json | null
          new_status: string
          previous_data: Json | null
          previous_status: string | null
          purchase_order_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          new_status: string
          previous_data?: Json | null
          previous_status?: string | null
          purchase_order_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          new_status?: string
          previous_data?: Json | null
          previous_status?: string | null
          purchase_order_id?: string
        }
        Relationships: []
      }
      purchase_order_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          mime_type: string | null
          purchase_order_id: string | null
          quotation_id: string | null
          supplier_id: string | null
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          purchase_order_id?: string | null
          quotation_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          purchase_order_id?: string | null
          quotation_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_documents_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_documents_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          item_name: string
          medication_id: string | null
          notes: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number | null
          received_date: string | null
          received_quantity: number | null
          received_unit_cost: number | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name: string
          medication_id?: string | null
          notes?: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number | null
          received_date?: string | null
          received_quantity?: number | null
          received_unit_cost?: number | null
          total_cost: number
          unit_cost: number
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name?: string
          medication_id?: string | null
          notes?: string | null
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          received_date?: string | null
          received_quantity?: number | null
          received_unit_cost?: number | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          delivery_date: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          payment_status: string | null
          payment_terms: string | null
          po_number: string
          quotation_id: string | null
          quotation_request_id: string | null
          received_at: string | null
          received_by: string | null
          requested_by: string | null
          shipping_cost: number | null
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string
          tax_amount: number | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          delivery_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: string | null
          payment_terms?: string | null
          po_number: string
          quotation_id?: string | null
          quotation_request_id?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_by?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id: string
          tax_amount?: number | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          delivery_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: string | null
          payment_terms?: string | null
          po_number?: string
          quotation_id?: string | null
          quotation_request_id?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_by?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string
          tax_amount?: number | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_sessions: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          patient_id: string
          queue_id: string
          session_data: Json
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          patient_id: string
          queue_id: string
          session_data?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          queue_id?: string
          session_data?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_comparisons: {
        Row: {
          comparison_criteria: Json | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          notes: string | null
          quotation_ids: string[]
          quotation_request_id: string
          updated_at: string
        }
        Insert: {
          comparison_criteria?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          quotation_ids: string[]
          quotation_request_id: string
          updated_at?: string
        }
        Update: {
          comparison_criteria?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          quotation_ids?: string[]
          quotation_request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_comparisons_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          brand: string | null
          created_at: string
          delivery_time_days: number | null
          id: string
          item_description: string
          medication_id: string | null
          minimum_order_quantity: number | null
          notes: string | null
          quantity: number
          quotation_id: string
          quotation_request_item_id: string | null
          specifications: string | null
          total_price: number
          unit_of_measure: string
          unit_price: number
        }
        Insert: {
          brand?: string | null
          created_at?: string
          delivery_time_days?: number | null
          id?: string
          item_description: string
          medication_id?: string | null
          minimum_order_quantity?: number | null
          notes?: string | null
          quantity: number
          quotation_id: string
          quotation_request_item_id?: string | null
          specifications?: string | null
          total_price: number
          unit_of_measure?: string
          unit_price: number
        }
        Update: {
          brand?: string | null
          created_at?: string
          delivery_time_days?: number | null
          id?: string
          item_description?: string
          medication_id?: string | null
          minimum_order_quantity?: number | null
          notes?: string | null
          quantity?: number
          quotation_id?: string
          quotation_request_item_id?: string | null
          specifications?: string | null
          total_price?: number
          unit_of_measure?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_request_item_id_fkey"
            columns: ["quotation_request_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_request_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_request_items: {
        Row: {
          created_at: string
          id: string
          item_description: string
          medication_id: string | null
          notes: string | null
          quotation_request_id: string
          requested_quantity: number
          specifications: string | null
          unit_of_measure: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_description: string
          medication_id?: string | null
          notes?: string | null
          quotation_request_id: string
          requested_quantity: number
          specifications?: string | null
          unit_of_measure?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_description?: string
          medication_id?: string | null
          notes?: string | null
          quotation_request_id?: string
          requested_quantity?: number
          specifications?: string | null
          unit_of_measure?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_request_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_request_items_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          notes: string | null
          priority: string
          request_date: string
          request_number: string
          requested_by: string
          required_by_date: string | null
          status: string
          supplier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          priority?: string
          request_date?: string
          request_number: string
          requested_by: string
          required_by_date?: string | null
          status?: string
          supplier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          priority?: string
          request_date?: string
          request_number?: string
          requested_by?: string
          required_by_date?: string | null
          status?: string
          supplier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          comparison_notes: string | null
          created_at: string
          currency: string
          delivery_terms: string | null
          id: string
          metadata: Json | null
          notes: string | null
          payment_terms: string | null
          quotation_date: string
          quotation_number: string
          quotation_request_id: string
          rejected_reason: string | null
          status: string
          supplier_id: string
          supplier_reference: string | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          comparison_notes?: string | null
          created_at?: string
          currency?: string
          delivery_terms?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_terms?: string | null
          quotation_date?: string
          quotation_number: string
          quotation_request_id: string
          rejected_reason?: string | null
          status?: string
          supplier_id: string
          supplier_reference?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          comparison_notes?: string | null
          created_at?: string
          currency?: string
          delivery_terms?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_terms?: string | null
          quotation_date?: string
          quotation_number?: string
          quotation_request_id?: string
          rejected_reason?: string | null
          status?: string
          supplier_id?: string
          supplier_reference?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recall_campaigns: {
        Row: {
          appointments_booked: number | null
          campaign_name: string
          campaign_status: string | null
          created_at: string
          created_by: string | null
          executed_at: string | null
          id: string
          message_template: string
          patients_contacted: number | null
          patients_targeted: number | null
          scheduled_date: string | null
          target_criteria: Json
          updated_at: string
        }
        Insert: {
          appointments_booked?: number | null
          campaign_name: string
          campaign_status?: string | null
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          id?: string
          message_template: string
          patients_contacted?: number | null
          patients_targeted?: number | null
          scheduled_date?: string | null
          target_criteria: Json
          updated_at?: string
        }
        Update: {
          appointments_booked?: number | null
          campaign_name?: string
          campaign_status?: string | null
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          id?: string
          message_template?: string
          patients_contacted?: number | null
          patients_targeted?: number | null
          scheduled_date?: string | null
          target_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_approval_requests: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          escalated_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          reconciliation_id: string
          rejection_reason: string | null
          requested_at: string
          requested_by: string | null
          status: string
          workflow_id: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          escalated_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          reconciliation_id: string
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
          workflow_id: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          escalated_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          reconciliation_id?: string
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_approval_reconciliation"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "panel_claims_reconciliation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_approval_workflow"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_approval_workflows: {
        Row: {
          auto_escalate_days: number | null
          created_at: string
          created_by: string | null
          escalation_role: Database["public"]["Enums"]["user_role"] | null
          id: string
          is_active: boolean
          panel_id: string | null
          required_approver_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          variance_threshold_amount: number
          variance_threshold_percentage: number
          workflow_name: string
        }
        Insert: {
          auto_escalate_days?: number | null
          created_at?: string
          created_by?: string | null
          escalation_role?: Database["public"]["Enums"]["user_role"] | null
          id?: string
          is_active?: boolean
          panel_id?: string | null
          required_approver_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          variance_threshold_amount?: number
          variance_threshold_percentage?: number
          workflow_name: string
        }
        Update: {
          auto_escalate_days?: number | null
          created_at?: string
          created_by?: string | null
          escalation_role?: Database["public"]["Enums"]["user_role"] | null
          id?: string
          is_active?: boolean
          panel_id?: string | null
          required_approver_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          variance_threshold_amount?: number
          variance_threshold_percentage?: number
          workflow_name?: string
        }
        Relationships: []
      }
      reconciliation_variance_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string
          default_action: string | null
          description: string | null
          id: string
          is_active: boolean
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string
          default_action?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string
          default_action?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      reorder_suggestions: {
        Row: {
          average_consumption_daily: number | null
          cost_estimate: number | null
          created_at: string
          current_stock: number
          expires_at: string | null
          id: string
          last_order_date: string | null
          last_order_quantity: number | null
          lead_time_days: number | null
          medication_id: string
          minimum_stock_level: number
          priority_level: string | null
          reason: string | null
          status: string | null
          suggested_quantity: number
          suggested_supplier_id: string | null
          updated_at: string
        }
        Insert: {
          average_consumption_daily?: number | null
          cost_estimate?: number | null
          created_at?: string
          current_stock: number
          expires_at?: string | null
          id?: string
          last_order_date?: string | null
          last_order_quantity?: number | null
          lead_time_days?: number | null
          medication_id: string
          minimum_stock_level: number
          priority_level?: string | null
          reason?: string | null
          status?: string | null
          suggested_quantity: number
          suggested_supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          average_consumption_daily?: number | null
          cost_estimate?: number | null
          created_at?: string
          current_stock?: number
          expires_at?: string | null
          id?: string
          last_order_date?: string | null
          last_order_quantity?: number | null
          lead_time_days?: number | null
          medication_id?: string
          minimum_stock_level?: number
          priority_level?: string | null
          reason?: string | null
          status?: string | null
          suggested_quantity?: number
          suggested_supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reorder_suggestions_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_suggestions_suggested_supplier_id_fkey"
            columns: ["suggested_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          availability_schedule: Json | null
          capacity: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          availability_schedule?: Json | null
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          availability_schedule?: Json | null
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
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
      stock_adjustment_audit: {
        Row: {
          adjusted_at: string
          adjusted_by: string | null
          adjustment_quantity: number
          after_data: Json | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          before_data: Json | null
          created_at: string
          id: string
          ip_address: string | null
          medication_id: string
          metadata: Json | null
          movement_id: string | null
          new_stock: number
          previous_stock: number
          reason: string
          reference_number: string | null
          user_agent: string | null
        }
        Insert: {
          adjusted_at?: string
          adjusted_by?: string | null
          adjustment_quantity: number
          after_data?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          medication_id: string
          metadata?: Json | null
          movement_id?: string | null
          new_stock: number
          previous_stock: number
          reason: string
          reference_number?: string | null
          user_agent?: string | null
        }
        Update: {
          adjusted_at?: string
          adjusted_by?: string | null
          adjustment_quantity?: number
          after_data?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          medication_id?: string
          metadata?: Json | null
          movement_id?: string | null
          new_stock?: number
          previous_stock?: number
          reason?: string
          reference_number?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustment_audit_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustment_audit_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "medication_cost_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustment_audit_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_number: string | null
          cost_per_unit_after: number | null
          cost_per_unit_before: number | null
          created_at: string
          created_by: string
          expiry_date: string | null
          id: string
          medication_id: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          quantity: number
          reason: string
          reference_number: string | null
          supplier_name: string | null
          total_cost: number | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          cost_per_unit_after?: number | null
          cost_per_unit_before?: number | null
          created_at?: string
          created_by: string
          expiry_date?: string | null
          id?: string
          medication_id: string
          movement_type: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          quantity: number
          reason: string
          reference_number?: string | null
          supplier_name?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          cost_per_unit_after?: number | null
          cost_per_unit_before?: number | null
          created_at?: string
          created_by?: string
          expiry_date?: string | null
          id?: string
          medication_id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          quantity?: number
          reason?: string
          reference_number?: string | null
          supplier_name?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_catalog_items: {
        Row: {
          brand_name: string | null
          catalog_description: string | null
          catalog_item_code: string
          catalog_item_name: string
          catalog_metadata: Json | null
          created_at: string
          id: string
          is_available: boolean | null
          last_updated_price_date: string | null
          lead_time_days: number | null
          manufacturer: string | null
          medication_id: string | null
          minimum_order_quantity: number | null
          pack_size: number | null
          supplier_id: string
          unit_of_measure: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          catalog_description?: string | null
          catalog_item_code: string
          catalog_item_name: string
          catalog_metadata?: Json | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          last_updated_price_date?: string | null
          lead_time_days?: number | null
          manufacturer?: string | null
          medication_id?: string | null
          minimum_order_quantity?: number | null
          pack_size?: number | null
          supplier_id: string
          unit_of_measure?: string | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          catalog_description?: string | null
          catalog_item_code?: string
          catalog_item_name?: string
          catalog_metadata?: Json | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          last_updated_price_date?: string | null
          lead_time_days?: number | null
          manufacturer?: string | null
          medication_id?: string | null
          minimum_order_quantity?: number | null
          pack_size?: number | null
          supplier_id?: string
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_catalog_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_catalog_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_communications: {
        Row: {
          attachments: Json | null
          communication_type: string
          content: string | null
          created_at: string
          created_by: string | null
          direction: string
          id: string
          metadata: Json | null
          purchase_order_id: string | null
          quotation_id: string | null
          recipient_email: string | null
          sender_email: string | null
          status: string | null
          subject: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          communication_type: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction: string
          id?: string
          metadata?: Json | null
          purchase_order_id?: string | null
          quotation_id?: string | null
          recipient_email?: string | null
          sender_email?: string | null
          status?: string | null
          subject?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          communication_type?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          purchase_order_id?: string | null
          quotation_id?: string | null
          recipient_email?: string | null
          sender_email?: string | null
          status?: string | null
          subject?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_communications_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_communications_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_communications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          notes: string | null
          payment_terms: string | null
          phone: string | null
          status: string | null
          supplier_code: string | null
          supplier_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          supplier_code?: string | null
          supplier_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          supplier_code?: string | null
          supplier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tier_assignment_log: {
        Row: {
          assigned_by: string
          assignment_method: string
          assignment_reason: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_tier_id: string | null
          patient_id: string
          previous_tier_id: string | null
        }
        Insert: {
          assigned_by: string
          assignment_method?: string
          assignment_reason?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_tier_id?: string | null
          patient_id: string
          previous_tier_id?: string | null
        }
        Update: {
          assigned_by?: string
          assignment_method?: string
          assignment_reason?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_tier_id?: string | null
          patient_id?: string
          previous_tier_id?: string | null
        }
        Relationships: []
      }
      tier_payment_methods: {
        Row: {
          created_at: string | null
          id: string
          payment_method_type: string
          payment_method_value: string
          tier_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_method_type: string
          payment_method_value: string
          tier_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_method_type?: string
          payment_method_value?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_payment_methods_tier_id_fkey"
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
          original_price: number | null
          quantity: number | null
          rate: number
          service_id: string | null
          tier_id_used: string | null
          tier_price_applied: number | null
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
          original_price?: number | null
          quantity?: number | null
          rate: number
          service_id?: string | null
          tier_id_used?: string | null
          tier_price_applied?: number | null
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
          original_price?: number | null
          quantity?: number | null
          rate?: number
          service_id?: string | null
          tier_id_used?: string | null
          tier_price_applied?: number | null
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
          {
            foreignKeyName: "treatment_items_tier_id_used_fkey"
            columns: ["tier_id_used"]
            isOneToOne: false
            referencedRelation: "price_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_type: string
          permission_value: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_type: string
          permission_value?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_type?: string
          permission_value?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          delivered_at: string | null
          error_message: string | null
          id: string
          integration_config_id: string | null
          payload_hash: string | null
          response_time_ms: number | null
          signature_valid: boolean | null
          status_code: number | null
        }
        Insert: {
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          integration_config_id?: string | null
          payload_hash?: string | null
          response_time_ms?: number | null
          signature_valid?: boolean | null
          status_code?: number | null
        }
        Update: {
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          integration_config_id?: string | null
          payload_hash?: string | null
          response_time_ms?: number | null
          signature_valid?: boolean | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_integration_config_id_fkey"
            columns: ["integration_config_id"]
            isOneToOne: false
            referencedRelation: "integration_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      medication_cost_history: {
        Row: {
          batch_number: string | null
          cost_per_unit_after: number | null
          cost_per_unit_before: number | null
          created_at: string | null
          created_by_name: string | null
          expiry_date: string | null
          id: string | null
          medication_id: string | null
          medication_name: string | null
          movement_type: string | null
          new_stock: number | null
          notes: string | null
          previous_stock: number | null
          quantity: number | null
          total_cost: number | null
          unit_cost: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_moving_average_cost: {
        Args: {
          p_medication_id: string
          p_new_quantity: number
          p_new_unit_cost: number
        }
        Returns: number
      }
      calculate_patient_reliability_score: {
        Args: { p_patient_id: string }
        Returns: number
      }
      check_appointment_overlap: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_doctor_id: string
          p_duration_minutes: number
          p_exclude_appointment_id?: string
        }
        Returns: boolean
      }
      check_claim_needs_approval: {
        Args: { p_amount: number; p_claim_id: string }
        Returns: boolean
      }
      check_po_requires_approval: {
        Args: { order_value: number; user_id: string }
        Returns: boolean
      }
      check_reconciliation_needs_approval: {
        Args: { reconciliation_id: string }
        Returns: boolean
      }
      check_resource_availability: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_duration_minutes: number
          p_exclude_appointment_id?: string
          p_resource_id: string
        }
        Returns: boolean
      }
      check_tier_eligibility: {
        Args: { p_patient_id: string; p_tier_id: string }
        Returns: boolean
      }
      convert_quotation_to_po: {
        Args: { p_created_by?: string; p_quotation_id: string }
        Returns: string
      }
      create_recurring_appointments: {
        Args: { p_base_appointment_id: string; p_recurrence_pattern: Json }
        Returns: string[]
      }
      generate_check_in_link: {
        Args: { p_appointment_id: string }
        Returns: string
      }
      generate_claim_aging_analysis: {
        Args: { p_panel_id?: string }
        Returns: {
          age_range: string
          avg_amount: number
          claim_count: number
          total_amount: number
        }[]
      }
      generate_claim_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_queue_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_quotation_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_quotation_request_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_reorder_suggestions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_uin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_calendar_appointments: {
        Args: { p_doctor_id?: string; p_end_date: string; p_start_date: string }
        Returns: {
          appointment_date: string
          appointment_time: string
          doctor_id: string
          doctor_name: string
          duration_minutes: number
          end_datetime: string
          id: string
          patient_id: string
          patient_name: string
          reason: string
          start_datetime: string
          status: string
        }[]
      }
      get_default_tier_for_panel: {
        Args: { p_panel_id: string }
        Returns: string
      }
      get_user_po_approval_limit: {
        Args: { user_id: string }
        Returns: number
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      process_po_receipt: {
        Args: { p_items: Json; p_po_id: string }
        Returns: undefined
      }
      process_waitlist_for_slot: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_doctor_id: string
          p_duration_minutes: number
        }
        Returns: {
          contact_info: Json
          patient_id: string
          waitlist_id: string
        }[]
      }
      update_patient_reliability: {
        Args: { p_patient_id: string }
        Returns: undefined
      }
      validate_claim_status_transition: {
        Args: { new_status: string; old_status: string }
        Returns: boolean
      }
    }
    Enums: {
      payment_method_type:
        | "Self-Pay"
        | "Insurance"
        | "Corporate"
        | "Government Panel"
      po_status:
        | "draft"
        | "quotation_requested"
        | "quotation_received"
        | "pending_approval"
        | "approved"
        | "ordered"
        | "partially_received"
        | "received"
        | "closed"
        | "cancelled"
      user_role: "admin" | "doctor" | "nurse" | "receptionist" | "locum"
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
      po_status: [
        "draft",
        "quotation_requested",
        "quotation_received",
        "pending_approval",
        "approved",
        "ordered",
        "partially_received",
        "received",
        "closed",
        "cancelled",
      ],
      user_role: ["admin", "doctor", "nurse", "receptionist", "locum"],
    },
  },
} as const
