import type { TutorExamQuestion } from "@/lib/tutor/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ExamQuestionDetailProps {
  question: TutorExamQuestion | null;
}

function pickQuestionText(item: TutorExamQuestion): string {
  return item.question || item.prompt || "";
}

function pickAnswerText(item: TutorExamQuestion): string {
  return item.answer_long || item.answer || item.answer_short || "";
}

function pickExplainText(item: TutorExamQuestion): string {
  return item.explain_fa || item.explain || "";
}

export function ExamQuestionDetail({ question }: ExamQuestionDetailProps) {
  if (!question) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a question to view details.
        </CardContent>
      </Card>
    );
  }

  const questionText = pickQuestionText(question);
  const answerText = pickAnswerText(question);
  const explainText = pickExplainText(question);

  return (
    <Card className="lg:max-h-[calc(100vh-230px)]">
      <CardHeader>
        <CardTitle className="text-base">{question.id}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 lg:overflow-y-auto lg:max-h-[calc(100vh-310px)] pr-1">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Question</h3>
          <p className="text-sm whitespace-pre-wrap">{questionText || "No question text available."}</p>
        </section>

        <Separator />

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Answer</h3>
          <p className="text-sm whitespace-pre-wrap">{answerText || "No answer available."}</p>
        </section>

        {explainText && (
          <>
            <Separator />
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Explain</h3>
              <p className="text-sm whitespace-pre-wrap">{explainText}</p>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
