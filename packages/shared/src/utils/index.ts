export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatCentsShort(cents: number): string {
  if (cents === 0) return 'Free';
  if (cents < 100) return `$${(cents / 100).toFixed(2)}`;
  return `$${Math.round(cents / 100)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
