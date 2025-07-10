import { useState, useEffect } from "preact/hooks";
import { SummaryCards } from "./components/SummaryCards";
import { FindingsTable } from "./components/FindingsTable";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import type { ASHReport } from "./types/ash";

export default function App() {
  const [data, setData] = useState<ASHReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load embedded data or fetch from JSON
    const jsonData = document.getElementById("ash-data")?.textContent;
    if (jsonData) {
      try {
        const parsed: ASHReport = JSON.parse(jsonData);
        setData(parsed);
      } catch (error) {
        console.error("Failed to parse ASH data:", error);
      }
    } else {
      // For development, use sample data
      const sampleData: ASHReport = {
        findings: [
          {
            tool: "Grype",
            severity: "CRITICAL",
            message: "Vulnerability CVE-2025-1234 in libfoo",
            location: "package.json",
            description:
              "A critical vulnerability has been discovered in libfoo that could allow remote code execution.",
            recommendation: "Upgrade to version 2.3.4 or later",
            cve: "CVE-2025-1234",
          },
          {
            tool: "git-secrets",
            severity: "HIGH",
            message: "AWS secret detected",
            location: "src/config.js",
            lineNumber: 42,
            pattern: "AKIA[0-9A-Z]{16}",
            description: "AWS access key detected in source code.",
            recommendation:
              "Remove the hardcoded AWS access key and use environment variables or AWS IAM roles.",
          },
          {
            tool: "Semgrep",
            severity: "MEDIUM",
            message: "Potential SQL injection vulnerability",
            location: "src/database.js",
            lineNumber: 128,
            description: "User input is directly concatenated into SQL query.",
            recommendation: "Use parameterized queries or prepared statements.",
          },
          {
            tool: "CDK-nag",
            severity: "LOW",
            message: "S3 bucket versioning not enabled",
            location: "infrastructure/s3-bucket.ts",
            description: "S3 bucket does not have versioning enabled.",
            recommendation:
              "Enable versioning for better data protection and recovery options.",
          },
        ],
        metadata: {
          scanDate: new Date().toISOString(),
          totalFindings: 4,
          tools: ["Grype", "git-secrets", "Semgrep", "CDK-nag"],
        },
      };
      setData(sampleData);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security report...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No Data Available
          </h1>
          <p className="text-gray-600">
            Unable to load ASH security report data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ASH Security Report
          </h1>
          <p className="text-gray-600">
            Scan completed:{" "}
            {new Date(data.metadata?.scanDate || Date.now()).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Total findings: {data.findings.length} | Tools used:{" "}
            {data.metadata?.tools.join(", ")}
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards findings={data.findings} />

        {/* Detailed Findings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <FindingsTable findings={data.findings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
