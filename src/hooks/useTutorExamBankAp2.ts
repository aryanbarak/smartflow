import { useEffect, useState } from "react";
import type { TutorExamBankAp2Bundle } from "@/lib/tutor/types";
import { fetchExamBankAp2Bundle } from "@/lib/tutor/client";

interface UseTutorExamBankAp2State {
  data: TutorExamBankAp2Bundle | null;
  isLoading: boolean;
  error: string | null;
}

export function useTutorExamBankAp2(): UseTutorExamBankAp2State {
  const [state, setState] = useState<UseTutorExamBankAp2State>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    fetchExamBankAp2Bundle()
      .then((data) => {
        if (!isMounted) return;
        setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : String(error);
        setState({ data: null, isLoading: false, error: message });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

