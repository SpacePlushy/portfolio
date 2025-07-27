"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePortfolioVariant } from "@/contexts/portfolio-variant-context";
import { portfolioContent } from "@/config/portfolio-content";

export default function AboutSection() {
  const variant = usePortfolioVariant();
  const content = portfolioContent[variant].about;
  return (
    <section id="about" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">{content.heading}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Professional Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                {content.summary}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-semibold">Key {variant === 'csr' ? 'Strengths' : 'Expertise'}</h4>
              <div className="flex flex-wrap gap-2">
                {variant === 'swe' ? (
                  <>
                    <Badge variant="secondary">Embedded Programming</Badge>
                    <Badge variant="secondary">Virtualization</Badge>
                    <Badge variant="secondary">Aerospace Systems</Badge>
                    <Badge variant="secondary">Real-time Systems</Badge>
                    <Badge variant="secondary">Hardware Integration</Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">Customer Satisfaction</Badge>
                    <Badge variant="secondary">First-Contact Resolution</Badge>
                    <Badge variant="secondary">Multi-channel Support</Badge>
                    <Badge variant="secondary">Technical Communication</Badge>
                    <Badge variant="secondary">Problem Solving</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="space-y-6">
                {content.stats.length > 0 && (
                  <>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">{content.stats[0].value}</div>
                      <div className="text-sm text-muted-foreground">{content.stats[0].label}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {content.stats.slice(1, 3).map((stat, index) => (
                        <div key={index} className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {content.stats[3] && (
                      <div className="text-center">
                        <div className="text-lg font-semibold mb-2">{content.stats[3].label}</div>
                        <div className="text-sm text-muted-foreground">
                          {content.stats[3].value}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}