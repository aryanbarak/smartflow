# IHK Explanation Template

Explain the following topic for IHK Fachinformatiker Anwendungsentwicklung exam.

## Format

### 1. Topic Summary
[Topic in 1-2 sentences — what it is and why it matters]

### 2. What the exam typically asks
[The standard exam question format for this topic]

### 3. Correct answer logic (step by step)
[Step by step correct answer logic]
[Include pseudocode if algorithm-related — use German IHK style]
[Use tables or diagrams if helpful for the topic type]

### 4. Exam traps / common mistakes
[Common mistakes, edge cases, traps in IHK exams for this topic]
[Point values and how to structure the answer for partial credit]

## Topic to Explain:
[TOPIC HERE]

---

## Example: Sorting Algorithms

### 1. Topic Summary
Sorting algorithms arrange elements in a defined order. IHK frequently tests Bubble Sort, Selection Sort, and binary search because they are easy to trace by hand.

### 2. What the exam typically asks
"Trace through the following array after each pass of Bubble Sort" or
"How many comparisons does Selection Sort need for n elements?"

### 3. Correct answer logic

Bubble Sort — compare adjacent pairs, swap if wrong order, repeat n-1 passes:
```
Pass 1: [5,3,8,1] → [3,5,1,8]  (largest bubbles to end)
Pass 2: [3,5,1,8] → [3,1,5,8]
Pass 3: [3,1,5,8] → [1,3,5,8]
```
Comparisons: n*(n-1)/2 → O(n²)

### 4. Exam traps
- IHK expects you to show every single swap, not just the final result
- "Stable" sort means equal elements keep original order — Bubble Sort is stable
- Don't confuse passes with comparisons — they want both sometimes
