import type { Question, QuestionResult, QuizConfig } from '../types/quiz';
import type { Answer } from './answers';

const normalize = (text: string) => text.trim().toLowerCase();
const asList = (value: Answer | undefined): string[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

// Every question type is all or nothing: full points only for a fully
// correct answer. Text answers ignore case and surrounding spaces.
function isCorrect(question: Question, answer: Answer | undefined): boolean {
  const correct = asList(question.correctAnswer);
  const given = asList(answer);

  switch (question.type) {
    case 'multi-select': {
      const chosen = new Set(given);
      return (
        chosen.size === new Set(correct).size &&
        correct.every((id) => chosen.has(id))
      );
    }
    case 'short-answer': {
      const text = typeof answer === 'string' ? normalize(answer) : '';
      return (
        text !== '' && correct.some((option) => normalize(option) === text)
      );
    }
    case 'multi-blank':
      return (
        correct.length > 0 &&
        correct.every(
          (expected, index) =>
            normalize(given[index] ?? '') === normalize(expected),
        )
      );
    default:
      return typeof answer === 'string' && answer === question.correctAnswer;
  }
}

export function gradeQuestion(
  question: Question,
  answer: Answer | undefined,
): QuestionResult {
  const correct = isCorrect(question, answer);
  return {
    questionId: question.id,
    earnedPoints: correct ? question.points : 0,
    maxPoints: question.points,
    isCorrect: correct,
    userAnswer: answer ?? '',
    correctAnswer: question.correctAnswer,
  };
}

export function gradeQuiz(
  quiz: QuizConfig,
  answers: Record<string, Answer | undefined>,
) {
  const results = quiz.questions.map((question) =>
    gradeQuestion(question, answers[question.id]),
  );
  const earnedScore = results.reduce((sum, r) => sum + r.earnedPoints, 0);
  const totalPoints = results.reduce((sum, r) => sum + r.maxPoints, 0);
  const percentage =
    totalPoints === 0
      ? 0
      : Math.round((earnedScore / totalPoints) * 10000) / 100;
  return { results, earnedScore, totalPoints, percentage };
}
