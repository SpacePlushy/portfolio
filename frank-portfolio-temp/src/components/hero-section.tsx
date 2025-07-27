"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, Mail, Phone, ExternalLink, Code, Users } from "lucide-react";
import Image from "next/image";
import { usePortfolioVariant } from "@/contexts/portfolio-variant-context";
import { portfolioContent } from "@/config/portfolio-content";

export default function HeroSection() {
  const variant = usePortfolioVariant();
  const content = portfolioContent[variant].hero;
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-20"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Image
                  src={process.env.NEXT_PUBLIC_HEADSHOT_URL || '/headshot.png'}
                  alt={`${content.name} - ${content.title}`}
                  width={200}
                  height={200}
                  className="rounded-full border-4 border-primary/20 shadow-lg"
                  priority
                  sizes="(max-width: 640px) 150px, (max-width: 768px) 175px, 200px"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground">
              {content.name}
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-muted-foreground">
              {content.title}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {content.tagline}
            </p>
          </div>

          <div className="space-y-6">
            {variant === 'general' ? (
              /* Portfolio selection buttons for general landing page */
              <>
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">Choose the portfolio you&apos;d like to explore:</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button
                    size="lg"
                    className="group bg-green-600 hover:bg-green-700 h-16"
                    asChild
                  >
                    <a href="https://csr.palmisano.io">
                      <Users className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Customer Service</div>
                        <div className="text-xs opacity-90">99% CSAT • Top 4%</div>
                      </div>
                    </a>
                  </Button>
                  
                  <Button
                    size="lg"
                    className="group bg-blue-600 hover:bg-blue-700 h-16"
                    asChild
                  >
                    <a href="https://swe.palmisano.io">
                      <Code className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Software Engineering</div>
                        <div className="text-xs opacity-90">NASA • Embedded Systems</div>
                      </div>
                    </a>
                  </Button>
                </div>

                {/* Contact buttons below portfolio selection */}
                <div className="pt-4 space-y-3">
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      variant="outline"
                      className="group w-full max-w-sm"
                      asChild
                    >
                      <a href={`mailto:${content.email}`}>
                        <Mail className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                        Email Me
                      </a>
                    </Button>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 max-w-[140px]"
                      asChild
                    >
                      <a href={`tel:${content.phone.replace(/[^0-9+]/g, '')}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Me
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 max-w-[140px]"
                      asChild
                    >
                      <a href={content.linkedin} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Original contact buttons for SWE and CSR portfolios */
              <>
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="group w-full max-w-sm"
                    asChild
                  >
                    <a href={`mailto:${content.email}`}>
                      <Mail className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      Email Me
                    </a>
                  </Button>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 max-w-[140px]"
                    asChild
                  >
                    <a href={`tel:${content.phone.replace(/[^0-9+]/g, '')}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call Me
                    </a>
                  </Button>
                  {variant !== 'csr' && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 max-w-[140px]"
                      asChild
                    >
                      <a href={content.linkedin} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-8 mb-16 md:mb-0">
            <button
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors group py-2"
              onClick={() => {
                const element = document.getElementById('about');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <span className="mr-2">Learn more</span>
              <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}