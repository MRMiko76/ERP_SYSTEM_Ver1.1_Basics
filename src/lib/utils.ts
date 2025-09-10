import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// دالة لتنسيق التاريخ
export function formatDate(date: Date | string): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// دالة لتنسيق العملة
export function formatCurrency(amount: number, currency: string = 'EGP'): string {
  if (typeof amount !== 'number') return '-';
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}
