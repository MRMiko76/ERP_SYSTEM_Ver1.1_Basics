"use client";

import { ThemeProvider } from "next-themes";
import { QueryProvider } from "./providers/query-provider";
import { AuthProvider } from "@/contexts/auth-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}