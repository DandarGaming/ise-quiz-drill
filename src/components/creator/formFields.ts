// Shared by the creator forms
export const fieldLabel =
  'block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5';
export const textInput =
  'w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#006fbf] focus:border-transparent outline-none text-gray-900';

// An empty field reads as 0 while typing; validation reports it until fixed
export const toNumber = (text: string, max: number) =>
  Math.min(max, Math.max(0, Math.floor(Number(text) || 0)));
