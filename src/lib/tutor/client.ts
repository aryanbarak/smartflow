import type { TutorExamBankAp2Bundle, TutorExamBank, TutorIndex, TutorManifest } from "@/lib/tutor/types";
import { isTutorExamBank, isTutorIndex, isTutorManifest } from "@/lib/tutor/validators";

const JSON_HEADERS = { Accept: "application/json" };
const valueCache = new Map<string, unknown>();
const inflightCache = new Map<string, Promise<unknown>>();

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: JSON_HEADERS });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function fetchCached<T>(url: string, guard: (value: unknown) => value is T): Promise<T> {
  if (valueCache.has(url)) {
    const cached = valueCache.get(url);
    if (guard(cached)) return cached;
    valueCache.delete(url);
  }

  if (!inflightCache.has(url)) {
    const pending = fetchJson(url)
      .then((payload) => {
        if (!guard(payload)) {
          throw new Error(`Schema validation failed for ${url}`);
        }
        valueCache.set(url, payload);
        return payload;
      })
      .finally(() => inflightCache.delete(url));
    inflightCache.set(url, pending);
  }

  const result = await inflightCache.get(url);
  if (!guard(result)) {
    throw new Error(`Schema validation failed for ${url}`);
  }
  return result;
}

export async function fetchTutorManifest(): Promise<TutorManifest> {
  return fetchCached("/tutor/manifest.json", isTutorManifest);
}

export async function fetchTutorIndex(): Promise<TutorIndex> {
  return fetchCached("/tutor/index.json", isTutorIndex);
}

function resolveExamPath(index: TutorIndex): string {
  const topic = index.topics.find((item) => item.slug === "exam_bank_ap2");
  const examPath = topic?.paths?.exam_de;
  if (typeof examPath === "string" && examPath.length > 0) {
    return examPath;
  }
  return "/tutor/topics/exam_bank_ap2/exam.de.v1.json";
}

export async function fetchExamBankAp2Bundle(): Promise<TutorExamBankAp2Bundle> {
  const manifest = await fetchTutorManifest();
  const index = await fetchTutorIndex();
  const examPath = resolveExamPath(index);
  const exam = await fetchCached<TutorExamBank>(examPath, isTutorExamBank);
  return { manifest, index, exam };
}

