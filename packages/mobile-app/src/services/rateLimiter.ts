const stores: Map<string, { timestamps: number[]; maxPerMinute: number }> = new Map();

export interface RateLimitConfig {
  maxPerMinute: number;
  maxPerHour?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxPerMinute: 20,
  maxPerHour: 200,
};

export function checkRateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIG): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const oneHourAgo = now - 3_600_000;

  if (!stores.has(key)) {
    stores.set(key, { timestamps: [], maxPerMinute: config.maxPerMinute });
  }

  const store = stores.get(key)!;
  store.timestamps = store.timestamps.filter((t) => t > oneHourAgo);

  const recentMinute = store.timestamps.filter((t) => t > oneMinuteAgo);
  if (recentMinute.length >= config.maxPerMinute) {
    return false;
  }

  if (config.maxPerHour) {
    const recentHour = store.timestamps.filter((t) => t > oneHourAgo);
    if (recentHour.length >= config.maxPerHour) {
      return false;
    }
  }

  store.timestamps.push(now);
  return true;
}

export function getRateLimitRemaining(key: string, config: RateLimitConfig = DEFAULT_CONFIG): number {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const store = stores.get(key);
  if (!store) return config.maxPerMinute;

  const recentMinute = store.timestamps.filter((t) => t > oneMinuteAgo);
  return Math.max(0, config.maxPerMinute - recentMinute.length);
}

export function resetRateLimit(key: string) {
  stores.delete(key);
}
