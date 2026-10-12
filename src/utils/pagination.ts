import type { Question, QuizConfig } from '../types/quiz';

// Paginated quizzes show one question per page, as Brightspace does;
// single-page quizzes show everything on page 1.
export function paginate(quiz: QuizConfig): {
  questions: Question[];
  totalPages: number;
} {
  const paginated = quiz.templateMode === 'paginated';
  const questions = quiz.questions.map((question, index) => ({
    ...question,
    number: question.number || index + 1,
    page: paginated ? index + 1 : 1,
  }));
  return {
    questions,
    totalPages: paginated ? Math.max(1, questions.length) : 1,
  };
}
