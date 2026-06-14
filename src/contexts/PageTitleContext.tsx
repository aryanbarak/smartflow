import { createContext, useCallback, useContext, useState } from "react";

interface PageTitle {
  title: string;
  subtitle?: string;
}

interface PageTitleContextValue {
  pageTitle: PageTitle | null;
  setPageTitle: (t: PageTitle | null) => void;
}

const PageTitleContext = createContext<PageTitleContextValue>({
  pageTitle: null,
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [pageTitle, setPageTitleState] = useState<PageTitle | null>(null);
  const setPageTitle = useCallback((t: PageTitle | null) => setPageTitleState(t), []);
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
