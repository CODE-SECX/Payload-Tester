export interface RegexPattern {
  id: string;
  name: string;
  pattern: string;
  flags?: string;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  bypass_of_what?: string;
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