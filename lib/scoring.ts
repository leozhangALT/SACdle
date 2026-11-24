export function calculatePoints(cluesShownWhenGuessed: number): number {
  if (cluesShownWhenGuessed <= 2) return 100;
  return Math.max(10, (12 - cluesShownWhenGuessed) * 10);
}
