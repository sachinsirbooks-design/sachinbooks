import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDriveImageUrl(url: string) {
  if (!url) return '';
  const trimmedUrl = url.trim();
  if (trimmedUrl.includes('drive.google.com')) {
    const idMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                    trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                    trimmedUrl.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
    
    if (idMatch && idMatch[1]) {
      // Bypasses preview screens for raw asset serving
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }
  return trimmedUrl;
}

export function formatPrice(price: any) {
  const numValue = (price === undefined || price === null || isNaN(Number(price))) ? 0 : Number(price);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numValue);
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}
