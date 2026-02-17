export interface TutorManifest {
  schema_name: string;
  version: string;
  generated_at: string;
  content_revision?: string;
  base_path: string;
  topics_count: number;
}

export interface TutorIndexTopic {
  slug: string;
  title_de?: string;
  title_fa?: string;
  paths?: Record<string, string>;
}

export interface TutorIndex {
  schema_name: string;
  version: string;
  generated_at: string;
  base_path: string;
  topics: TutorIndexTopic[];
}

export interface TutorExamQuestion {
  id: string;
  difficulty?: string;
  category?: string;
  question?: string;
  prompt?: string;
  answer?: string;
  answer_short?: string;
  answer_long?: string;
  explain?: string;
  explain_fa?: string;
  [key: string]: unknown;
}

export interface TutorExamBank {
  schema_name: string;
  version: string;
  generated_at?: string;
  lang?: string;
  question_count?: number;
  questions: TutorExamQuestion[];
}

export interface TutorExamBankAp2Bundle {
  manifest: TutorManifest;
  index: TutorIndex;
  exam: TutorExamBank;
}

export type TutorRunMode = "pseudocode" | "trace" | "quiz" | "exam" | "explain";
export type TutorRunLang = "de" | "fa";

export interface TutorVariant {
  id: string;
  label?: string;
  description?: string;
  is_default?: boolean;
}

export interface TutorRunRequestPayload {
  api_version: "v1";
  request_id: string;
  topic: string;
  mode: TutorRunMode;
  lang: TutorRunLang;
  params: Record<string, unknown>;
}

export interface TutorRunExecution {
  request: TutorRunRequestPayload;
  raw: Record<string, unknown>;
  result: unknown;
  events: unknown[];
  stats: Record<string, unknown> | null;
  questions: unknown[];
  logs: string[];
}
