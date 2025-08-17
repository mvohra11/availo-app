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
      appointment: {
        Row: {
          app_datetime: string
          app_id: number
          bus_id: string
          created_at: string
          cust_id: number
          emp_id: number | null
          serv_id: number
        }
        Insert: {
          app_datetime: string
          app_id?: number
          bus_id: string
          created_at?: string
          cust_id: number
          emp_id?: number | null
          serv_id: number
        }
        Update: {
          app_datetime?: string
          app_id?: number
          bus_id?: string
          created_at?: string
          cust_id?: number
          emp_id?: number | null
          serv_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "business"
            referencedColumns: ["bus_id"]
          },
          {
            foreignKeyName: "appointment_cust_id_fkey"
            columns: ["cust_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["cust_id"]
          },
          {
            foreignKeyName: "appointment_emp_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["emp_id"]
          },
          {
            foreignKeyName: "appointment_serv_id_fkey"
            columns: ["serv_id"]
            isOneToOne: false
            referencedRelation: "service"
            referencedColumns: ["serv_id"]
          },
        ]
      }
      business: {
        Row: {
          bus_email: string
          bus_id: string
          bus_name: string
          bus_owner_fname: string | null
          bus_owner_lname: string | null
          bus_phone: string
          created_at: string
        }
        Insert: {
          bus_email: string
          bus_id?: string
          bus_name: string
          bus_owner_fname?: string | null
          bus_owner_lname?: string | null
          bus_phone: string
          created_at?: string
        }
        Update: {
          bus_email?: string
          bus_id?: string
          bus_name?: string
          bus_owner_fname?: string | null
          bus_owner_lname?: string | null
          bus_phone?: string
          created_at?: string
        }
        Relationships: []
      }
      customer: {
        Row: {
          created_at: string
          cust_email: string
          cust_fname: string
          cust_id: number
          cust_lname: string | null
          cust_phone: string
        }
        Insert: {
          created_at?: string
          cust_email: string
          cust_fname: string
          cust_id?: number
          cust_lname?: string | null
          cust_phone: string
        }
        Update: {
          created_at?: string
          cust_email?: string
          cust_fname?: string
          cust_id?: number
          cust_lname?: string | null
          cust_phone?: string
        }
        Relationships: []
      }
      employee: {
        Row: {
          bus_id: string
          created_at: string
          emp_fname: string
          emp_id: number
          emp_lname: string | null
        }
        Insert: {
          bus_id: string
          created_at?: string
          emp_fname: string
          emp_id?: number
          emp_lname?: string | null
        }
        Update: {
          bus_id?: string
          created_at?: string
          emp_fname?: string
          emp_id?: number
          emp_lname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "business"
            referencedColumns: ["bus_id"]
          },
          {
            foreignKeyName: "employee_bus_id_fkey1"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "business"
            referencedColumns: ["bus_id"]
          },
        ]
      }
      employee_availability: {
        Row: {
          avail_day: string
          created_at: string
          emp_avail_id: number
          emp_id: number
          end_time: string
          start_time: string
        }
        Insert: {
          avail_day: string
          created_at?: string
          emp_avail_id?: number
          emp_id: number
          end_time: string
          start_time: string
        }
        Update: {
          avail_day?: string
          created_at?: string
          emp_avail_id?: number
          emp_id?: number
          end_time?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_emp_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["emp_id"]
          },
        ]
      }
      employee_service: {
        Row: {
          created_at: string
          emp_id: number
          emp_serv_id: number
          serv_id: number
        }
        Insert: {
          created_at?: string
          emp_id: number
          emp_serv_id?: number
          serv_id: number
        }
        Update: {
          created_at?: string
          emp_id?: number
          emp_serv_id?: number
          serv_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_service_emp_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["emp_id"]
          },
          {
            foreignKeyName: "employee_service_serv_id_fkey"
            columns: ["serv_id"]
            isOneToOne: false
            referencedRelation: "service"
            referencedColumns: ["serv_id"]
          },
        ]
      }
      service: {
        Row: {
          bus_id: string
          created_at: string
          serv_desc: string | null
          serv_emp_no: number
          serv_id: number
          serv_min_duration: number
          serv_name: string
          serv_price: number | null
        }
        Insert: {
          bus_id: string
          created_at?: string
          serv_desc?: string | null
          serv_emp_no?: number
          serv_id?: number
          serv_min_duration: number
          serv_name: string
          serv_price?: number | null
        }
        Update: {
          bus_id?: string
          created_at?: string
          serv_desc?: string | null
          serv_emp_no?: number
          serv_id?: number
          serv_min_duration?: number
          serv_name?: string
          serv_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "business"
            referencedColumns: ["bus_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
