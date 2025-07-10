// ASH Data Type Definitions
export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Finding {
  tool: string;
  severity: SeverityLevel;
  message: string;
  location: string;
  description?: string;
  recommendation?: string;
  lineNumber?: number;
  pattern?: string;
  cve?: string;
  score?: number;
}

export interface ScanMetadata {
  scanDate: string;
  totalFindings: number;
  tools: string[];
  duration?: number;
  version?: string;
}

export interface ASHReport {
  findings: Finding[];
  metadata: ScanMetadata;
}

export interface SeverityConfig {
  color: string;
  icon: string;
  priority: number;
}
