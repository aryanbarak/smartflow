import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatePanel } from "@/components/common/StatePanel";
import { ExamBankToolbar } from "@/components/tutor/ExamBankToolbar";
import { ExamQuestionList } from "@/components/tutor/ExamQuestionList";
import { ExamQuestionDetail } from "@/components/tutor/ExamQuestionDetail";
import { useTutorExamBankAp2 } from "@/hooks/useTutorExamBankAp2";
import type { TutorExamQuestion } from "@/lib/tutor/types";

function normalizeText(value: string | undefined): string {
  return (value || "").toLowerCase();
}

function matchesSearch(question: TutorExamQuestion, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const text = [
    question.id,
    question.category,
    question.difficulty,
    question.question,
    question.prompt,
    question.answer,
    question.answer_short,
    question.answer_long,
    question.explain,
    question.explain_fa,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(q);
}

export default function TutorPage() {
  const { data, isLoading, error } = useTutorExamBankAp2();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const didLogCount = useRef(false);

  const questions = data?.exam.questions ?? [];

  useEffect(() => {
    if (!didLogCount.current && questions.length > 0) {
      console.log("[TutorPage] AP2 questions_count =", questions.length);
      didLogCount.current = true;
    }
  }, [questions.length]);

  const categories = useMemo(
    () =>
      Array.from(new Set(questions.map((item) => normalizeText(item.category)).filter(Boolean))).sort(),
    [questions],
  );
  const difficulties = useMemo(
    () =>
      Array.from(new Set(questions.map((item) => normalizeText(item.difficulty)).filter(Boolean))).sort(),
    [questions],
  );

  const filtered = useMemo(() => {
    return questions.filter((question) => {
      const diffOk = difficulty === "all" || normalizeText(question.difficulty) === difficulty;
      const catOk = category === "all" || normalizeText(question.category) === category;
      return diffOk && catOk && matchesSearch(question, search);
    });
  }, [questions, difficulty, category, search]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => (prev && filtered.some((item) => item.id === prev) ? prev : filtered[0].id));
  }, [filtered]);

  const selected = useMemo(
    () => filtered.find((question) => question.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold font-display tracking-tight">Tutor (AP2)</h1>
        <p className="text-muted-foreground">
          Static source: manifest, index, and exam bank from <code>/tutor</code>.
        </p>
      </motion.div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Loading tutor content...</CardContent>
        </Card>
      ) : error ? (
        <StatePanel
          variant="error"
          title="Tutor content unavailable"
          description={error}
        />
      ) : questions.length === 0 ? (
        <StatePanel
          variant="empty"
          title="No questions found"
          description="Exam bank is empty or schema did not pass validation."
        />
      ) : (
        <div className="space-y-4">
          <ExamBankToolbar
            search={search}
            onSearchChange={setSearch}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            category={category}
            onCategoryChange={setCategory}
            difficulties={difficulties}
            categories={categories}
          />

          <div className="text-sm text-muted-foreground">
            Showing {filtered.length} of {questions.length} question(s)
          </div>

          {filtered.length === 0 ? (
            <StatePanel
              variant="empty"
              title="No matching questions"
              description="Try a different search term or reset filters."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <ExamQuestionList
                questions={filtered}
                selectedId={selectedId}
                onSelect={(question) => setSelectedId(question.id)}
              />
              <ExamQuestionDetail question={selected} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

