/** Hex colour helpers, the same rules as team-auth's App\Branding\Color. Pure. */

export function luminance(hex: string): number {
  return [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
}

/** Black or white, whichever reads better on `background` (WCAG contrast ratio). */
export function readableInk(background: string): string {
  const l = luminance(background);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? '#ffffff' : '#111111';
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}
