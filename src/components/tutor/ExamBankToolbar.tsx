import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExamBankToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: string;
  onDifficultyChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  difficulties: string[];
  categories: string[];
}

export function ExamBankToolbar({
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  category,
  onCategoryChange,
  difficulties,
  categories,
}: ExamBankToolbarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search question, answer, explain..."
      />

      <Select value={difficulty} onValueChange={onDifficultyChange}>
        <SelectTrigger>
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All difficulties</SelectItem>
          {difficulties.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

