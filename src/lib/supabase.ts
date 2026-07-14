import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xyzxvqcezhthphrvtmuo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enh2cWNlemh0aHBocnZ0bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTU2ODAsImV4cCI6MjA5OTYzMTY4MH0.DyhMs63nhYwwbd8Ezb0_Hr3d-2c9sTeZ6phLe-Cf5hg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  export type RepublicDataRow = {
  id: number | string;
  created_at: string;
  Name: string | null;
  Order: string | null;
  Amount: number | null;
  Status: string | null;
  table_number: number | null;
};
