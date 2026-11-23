/** RN-08: cliente pode cancelar até `windowMinutes` antes do início. */
export function canCustomerCancel(startsAt: Date, now: Date, windowMinutes: number): boolean {
  return startsAt.getTime() - now.getTime() >= windowMinutes * 60_000;
}
