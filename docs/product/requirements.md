# Requirements

## 1. Concept and goal

- Concept: a web-based mock testing app that gives students a practice
  environment which looks, behaves and reacts like the official Brightspace
  quiz interface.
- Goal: let students build practice tests from their own course material
  (slides, notes) and take them in an interface that matches the real exam.

## 2. Three levels of simulation

### Level 1: Visual fidelity

- Layout: Brightspace-style header bar with quiz title, timer countdown and
  exit action.
- Styling: fonts, spacing, borders, colors and button variants that match
  Brightspace.
- Progress and controls: page indicator (Page X of Y), Previous Page and
  Next Page buttons, Submit Quiz button.
- Templates:
  1. Paginated: one question per page with Next and Back navigation.
  2. Single-page scroll: all questions on one page with a sticky navigator.

### Level 2: Interaction fidelity

- Navigation: Next and Back, plus direct jumps from the question navigator.
- Question state: flag questions for review; the navigator shows Answered,
  Unanswered and Flagged.
- Auto-save: answers are saved on every change, with no manual save.
- Dialogs and warnings:
  - Confirmation before submit, listing unanswered questions.
  - Countdown alerts (for example 5 minutes left) and automatic submit when
    time runs out.

### Level 3: State resilience

- Refreshing the page (F5) keeps the timer, the current position, flags and
  answers.
- The timer follows wall-clock time: closing the tab does not pause it.

## 3. MVP scope (v0.1)

### 3.1 Main user flow

Create mock test, start quiz, take quiz, submit, view result and review.

### 3.2 Question types

1. Multiple choice: single choice with radio buttons.
2. Multiple select: checkboxes, all or nothing (no partial credit).
3. True or false.
4. Short answer: text input.
5. Fill in the blanks: several text inputs inside one prompt.

### 3.3 Test configuration

- Title and description.
- Question count and display mode (paginated or single-page scroll).
- Time limit in minutes and timer visibility.
- Scoring and pass threshold.

### 3.4 Technical constraints

- Every question follows one generic question schema (see
  src/types/quiz.ts once added).
- The UI renders questions through a single QuestionRenderer component.
  Separate hardcoded components per question are not allowed.
- Imported quiz JSON and saved browser data are validated before use.
- State lives in the browser for the MVP (see ADR-003).

## 4. After the MVP

- Generate tests from uploaded material with an LLM.
- Flashcards with spaced repetition.
- Sharing tests with other students.
