import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { queryClient } from "./lib/query-client";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";
import { isPreviewMode } from "./lib/preview";
import { installPreviewFetch } from "../preview-fixtures";
import { AppRoutes } from "./app.routes";
import { ErrorBoundary } from "./components/ErrorBoundary";

export function App() {
  useEffect(() => {
    if (isPreviewMode()) {
      installPreviewFetch();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
