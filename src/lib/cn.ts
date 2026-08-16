// Helper para combinar classes do Tailwind de forma limpa.
// clsx resolve condicionais; tailwind-merge remove duplicatas conflitantes (ex: "p-2 p-4" -> "p-4").
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
