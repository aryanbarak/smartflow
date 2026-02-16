import type {
  TutorExamBank,
  TutorExamQuestion,
  TutorIndex,
  TutorManifest,
} from "@/lib/tutor/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isTutorManifest(value: unknown): value is TutorManifest {
  if (!isRecord(value)) return false;
  return (
    isString(value.schema_name) &&
    isString(value.version) &&
    isString(value.generated_at) &&
    isString(value.base_path) &&
    typeof value.topics_count === "number"
  );
}

export function isTutorIndex(value: unknown): value is TutorIndex {
  if (!isRecord(value)) return false;
  if (!isString(value.schema_name) || !isString(value.version) || !Array.isArray(value.topics)) {
    return false;
  }
  return value.topics.every((topic) => isRecord(topic) && isString(topic.slug));
}

export function isTutorExamQuestion(value: unknown): value is TutorExamQuestion {
  if (!isRecord(value)) return false;
  return isString(value.id) && (isString(value.question) || isString(value.prompt));
}

export function isTutorExamBank(value: unknown): value is TutorExamBank {
  if (!isRecord(value)) return false;
  if (!isString(value.schema_name) || !isString(value.version) || !Array.isArray(value.questions)) {
    return false;
  }
  return value.questions.every((question) => isTutorExamQuestion(question));
}

