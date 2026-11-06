/** Czech date and greeting for the header. Pure. */

/** "čtvrtek 5. listopadu 2026" */
export function longDate(date: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Dobrou noc';
  if (h < 10) return 'Dobré ráno';
  if (h < 18) return 'Dobrý den';
  return 'Dobrý večer';
}
