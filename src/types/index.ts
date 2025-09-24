export interface RegexPattern {
  id: string;
  name: string;
  pattern: string;
  flags?: string;
  description?: string;
  category: string;
  is_active: boolean;
  waf_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestResult {
  payload: string;
  isBlocked: boolean;
  matchedPatterns: Array<{
    pattern: RegexPattern;
    matches: string[];
  }>;
  timestamp: Date;
  showBypassModal?: boolean;
}

export interface BypassRecord {
  id: string;
  payload: string;
  waf_names: string[];
  created_at?: string;
}