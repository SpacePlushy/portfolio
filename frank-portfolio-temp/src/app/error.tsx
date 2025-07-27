"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Portfolio error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-muted-foreground">
            We encountered an unexpected error while loading the portfolio.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full"
          >
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            Return to home
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <details className="text-left mt-6 p-4 bg-muted rounded-lg">
            <summary className="cursor-pointer text-sm font-medium">
              Error details
            </summary>
            <pre className="mt-2 text-xs overflow-auto">
              {error.message}
              {error.stack && "\n\n" + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}