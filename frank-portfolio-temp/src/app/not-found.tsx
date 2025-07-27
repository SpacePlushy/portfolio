import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <FileQuestion className="h-24 w-24 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            It might have been moved or doesn&apos;t exist.
          </p>
        </div>

        <div className="pt-4">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>Looking for something specific?</p>
          <div className="flex gap-4 justify-center mt-2">
            <Link 
              href="https://swe.palmisano.io" 
              className="hover:text-primary transition-colors"
            >
              Software Engineering
            </Link>
            <span>•</span>
            <Link 
              href="https://csr.palmisano.io" 
              className="hover:text-primary transition-colors"
            >
              Customer Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}