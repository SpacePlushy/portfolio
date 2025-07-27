"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Wrench, Star, Database, Phone, Users } from "lucide-react";
import { usePortfolioVariant } from "@/contexts/portfolio-variant-context";
import { portfolioContent } from "@/config/portfolio-content";

const getLevelColor = (level: string) => {
  switch (level) {
    case "Expert":
      return "bg-primary text-primary-foreground";
    case "Advanced":
      return "bg-primary/80 text-primary-foreground";
    case "Intermediate":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getIcon = (categoryName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    "Programming Languages": <Code className="h-5 w-5" />,
    "Technologies & Frameworks": <Wrench className="h-5 w-5" />,
    "Database & Storage": <Database className="h-5 w-5" />,
    "Specializations": <Star className="h-5 w-5" />,
    "Customer Service Excellence": <Users className="h-5 w-5" />,
    "Technical Proficiencies": <Phone className="h-5 w-5" />
  };
  return iconMap[categoryName] || <Star className="h-5 w-5" />;
};

export default function SkillsSection() {
  const variant = usePortfolioVariant();
  const content = portfolioContent[variant].skills;

  return (
    <section id="skills" className="py-20 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {content.heading}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {variant === 'swe'
              ? "Comprehensive technical skills spanning embedded systems, web development, and aerospace technology"
              : variant === 'csr'
              ? "Expert-level customer service skills combined with technical proficiency"
              : "Core professional competencies across multiple domains"
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {content.categories.map((category, index) => (
            <Card
              key={index}
              className="bg-background shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    {getIcon(category.name)}
                  </div>
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {category.items.map((skill, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <Badge
                        className={`text-xs ${getLevelColor(skill.level)}`}
                      >
                        {skill.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>Expert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/80 rounded-full"></div>
              <span>Advanced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <span>Intermediate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}