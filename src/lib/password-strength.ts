export function getPasswordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const labels = ["", "Débil", "Regular", "Fuerte", "Muy fuerte"];
  return { score, label: labels[score] ?? "" };
}

export const STRENGTH_COLORS = [
  "",
  "bg-mb-error",
  "bg-orange-400",
  "bg-yellow-300",
  "bg-mb-success",
];
