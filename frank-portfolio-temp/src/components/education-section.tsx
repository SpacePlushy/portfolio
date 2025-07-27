"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Calendar, Award } from "lucide-react";
import { usePortfolioVariant } from "@/contexts/portfolio-variant-context";
import { portfolioContent } from "@/config/portfolio-content";

export default function EducationSection() {
  const variant = usePortfolioVariant();
  const education = portfolioContent[variant].education;
  const certifications = portfolioContent[variant].certifications;

  return (
    <section id="education" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Education {certifications && certifications.length > 0 && "& Certifications"}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {variant === 'swe'
              ? "Academic foundation in computer science and engineering"
              : variant === 'csr'
              ? "Educational background and professional certifications"
              : "Academic foundation and continuous learning"
            }
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Education */}
          {education.map((edu, index) => (
            <Card key={index} className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {edu.degree}
                    </CardTitle>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{edu.school}</span>
                        <span>•</span>
                        <span>{edu.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{edu.period}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {variant === 'swe' && (
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Relevant Coursework</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Badge variant="outline" className="justify-center">
                          Data Structures
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Algorithms
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Software Engineering
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Computer Systems
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Operating Systems
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Database Systems
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Computer Networks
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Embedded Systems
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          Real-time Systems
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Academic Achievements</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>
                          <span className="text-muted-foreground">
                            Dean&apos;s List recognition for academic excellence
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>
                          <span className="text-muted-foreground">
                            Completed senior capstone project in embedded systems
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>
                          <span className="text-muted-foreground">
                            Active member of IEEE Computer Society
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Foundation for Career</h4>
                      <p className="text-muted-foreground">
                        My computer science education at ASU provided a strong
                        foundation in software engineering principles, which has
                        been instrumental in my career progression from intern to
                        senior software engineer working on mission-critical
                        aerospace systems.
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Certifications for CSR variant */}
          {certifications && certifications.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-center mb-6">Professional Certifications</h3>
              <div className="grid gap-4">
                {certifications.map((cert, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{cert.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{cert.issuer}</span>
                            <span>•</span>
                            <span>{cert.year}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}