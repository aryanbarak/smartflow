import type { TutorExamQuestion } from "@/lib/tutor/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExamQuestionListProps {
  questions: TutorExamQuestion[];
  selectedId: string | null;
  onSelect: (question: TutorExamQuestion) => void;
}

function getQuestionText(question: TutorExamQuestion): string {
  return question.question || question.prompt || "Untitled question";
}

export function ExamQuestionList({ questions, selectedId, onSelect }: ExamQuestionListProps) {
  return (
    <div className="space-y-3">
      {questions.map((question) => {
        const active = question.id === selectedId;
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelect(question)}
            className="w-full text-left"
          >
            <Card className={cn("transition-colors", active && "border-primary")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span className="truncate">{question.id}</span>
                  <div className="flex items-center gap-2">
                    {question.category && <Badge variant="secondary">{question.category}</Badge>}
                    {question.difficulty && <Badge variant="outline">{question.difficulty}</Badge>}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{getQuestionText(question)}</p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

