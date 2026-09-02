// Hand-written to match supabase/migrations/*.sql. Once the project is
// connected, prefer regenerating these with the Supabase CLI
// (`supabase gen types typescript`) and replacing this file.

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Relationship = {
  id: string;
  user_a: string;
  user_b: string;
  status: "active" | "disconnected";
  created_at: string;
  disconnected_at: string | null;
};

export type PairingCode = {
  id: string;
  code: string;
  created_by: string;
  expires_at: string;
  consumed_at: string | null;
  consumed_by: string | null;
  created_at: string;
};

export type AlertStatus =
  | "CREATED"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "ACKNOWLEDGED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export type PainEpisode = {
  id: string;
  user_id: string;
  severity: number | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EmergencyAlert = {
  id: string;
  episode_id: string;
  relationship_id: string;
  sender_id: string;
  recipient_id: string;
  status: AlertStatus;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  acknowledged_at: string | null;
  cancelled_at: string | null;
};
