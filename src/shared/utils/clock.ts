/** Relógio injetável — facilita testar regras que dependem do "agora". */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };
