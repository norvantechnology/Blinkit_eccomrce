import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'web';
  const key = 'blinkit_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `web_${crypto.randomUUID()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function formatPhoneForApi(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (raw.startsWith('+')) return raw;
  return `+${digits}`;
}
