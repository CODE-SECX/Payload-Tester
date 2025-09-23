export interface RegexPattern {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  description?: string;
}

export interface TestResult {
  payload: string;
  isBlocked: boolean;
  matchedPatterns: Array<{
    pattern: RegexPattern;
    matches: string[];
  }>;
  timestamp: Date;
}