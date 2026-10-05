import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

export const useAuditoria = () => useQuery({
  queryKey: ["auditoria_operacional"],
  queryFn: async () => {
    const { data, error } = await supabase.from("auditoria_operacional").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return data ?? [];
  },
});
