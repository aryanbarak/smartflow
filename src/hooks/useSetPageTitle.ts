import { useEffect } from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";

export function useSetPageTitle(title: string, subtitle?: string) {
  const { setPageTitle } = usePageTitle();
  useEffect(() => {
    setPageTitle({ title, subtitle });
    return () => setPageTitle(null);
  }, [title, subtitle, setPageTitle]);
}
