import { supabase } from "@/services/supabase/client";
import type { TablesUpdate } from "@/services/supabase/types";

export const salvarPessoa = async ({ id, values }: { id: string; values: TablesUpdate<"pessoas"> }) => {
  const { error } = await supabase.from("pessoas").update(values).eq("id", id);
  if (error) throw error;
};
