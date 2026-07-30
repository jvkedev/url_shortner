export const ONE_MINUTE = 60_000;

export const RATE_LIMITS = {
  AUTH: 5,
  URL: 20,
  REDIRECT: 1000,
  GLOBAL: 100,
} as const;

export const CACHE_TTL = {
  URL: 3600,
} as const;
