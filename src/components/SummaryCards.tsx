import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { severityConfig } from "../lib/utils";
import type { Finding, SeverityLevel } from "../types/ash";

interface SummaryCardsProps {
  findings: Finding[];
}

export function SummaryCards({ findings }: SummaryCardsProps) {
  const counts = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    },
    {} as Record<SeverityLevel, number>,
  );

  const getSeverityVariant = (severity: SeverityLevel) => {
    switch (severity) {
      case "CRITICAL":
        return "error";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Object.entries(severityConfig).map(([severity, config]) => {
        const severityKey = severity as SeverityLevel;
        const count = counts[severityKey] || 0;

        return (
          <Card key={severity} className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {config.icon} {severity}
                </CardTitle>
                <Badge variant={getSeverityVariant(severityKey)}>{count}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <p className="text-xs text-gray-700">
                {count === 1 ? "finding" : "findings"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
