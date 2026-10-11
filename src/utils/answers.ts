export type Answer = string | string[];

// A list (multiple select, blanks) counts once any entry is filled in
export function isAnswered(answer: Answer | undefined): boolean {
  if (Array.isArray(answer)) return answer.some((part) => part.trim() !== '');
  return (answer ?? '').trim() !== '';
}
