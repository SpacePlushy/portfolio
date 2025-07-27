"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Rocket, TestTube, DollarSign, Star, Award, TrendingUp } from "lucide-react";
import { usePortfolioVariant } from "@/contexts/portfolio-variant-context";
import { portfolioContent } from "@/config/portfolio-content";

const getIcon = (achievementTitle: string) => {
  if (achievementTitle.includes("NASA") || achievementTitle.includes("Artemis")) return <Rocket className="h-6 w-6" />;
  if (achievementTitle.includes("ISS") || achievementTitle.includes("Testing")) return <TestTube className="h-6 w-6" />;
  if (achievementTitle.includes("Top") || achievementTitle.includes("Ranking")) return <Trophy className="h-6 w-6" />;
  if (achievementTitle.includes("Satisfaction") || achievementTitle.includes("CSAT")) return <Star className="h-6 w-6" />;
  if (achievementTitle.includes("Awards") || achievementTitle.includes("Service")) return <Award className="h-6 w-6" />;
  if (achievementTitle.includes("Knowledge") || achievementTitle.includes("Process")) return <TrendingUp className="h-6 w-6" />;
  return <Trophy className="h-6 w-6" />;
};

export default function AchievementsSection() {
  const variant = usePortfolioVariant();
  const achievements = portfolioContent[variant].achievements;

  return (
    <section id="achievements" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Key Achievements
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {variant === 'swe'
              ? "Transforming aerospace technology through innovative software solutions"
              : variant === 'csr'
              ? "Delivering exceptional customer experiences with measurable impact"
              : "Notable achievements across professional domains"
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {achievements.slice(0, 4).map((achievement, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    {getIcon(achievement.title)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">
                        {achievement.title}
                      </CardTitle>
                      {variant === 'swe' && (
                        <Badge variant="secondary" className="text-xs">
                          {achievement.title.includes("NASA") ? "NASA Artemis" : "ISS Innovation"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievement.impact && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {achievement.impact}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {achievements.length > 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {achievements.slice(4).map((achievement, index) => (
              <Card key={index + 4} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-primary/10 rounded">
                      {getIcon(achievement.title)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      {achievement.impact && (
                        <p className="text-xs text-primary mt-1 font-medium">{achievement.impact}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Alert className="bg-primary/5 border-primary/20">
          <Trophy className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Recognition:</strong> {variant === 'swe'
              ? "These achievements demonstrate expertise in mission-critical software development, cost optimization, and innovation in aerospace technology. The work contributed directly to advancing human space exploration capabilities."
              : variant === 'csr'
              ? "These achievements reflect a proven track record of exceptional customer service, operational excellence, and the ability to consistently exceed performance metrics across diverse industries."
              : "These achievements demonstrate versatility and excellence across multiple professional domains, showcasing both technical expertise and exceptional interpersonal skills."
            }
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}