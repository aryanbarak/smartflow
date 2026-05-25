import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFamilyNames(): string[] {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("family_children")
      .select("name")
      .then(({ data }) => {
        if (data) setNames(data.map((r: { name: string }) => r.name));
      });
  }, []);

  return names;
}
