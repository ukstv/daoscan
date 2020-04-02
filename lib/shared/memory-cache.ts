import { CacheMap } from "./cache-map";
import { Mutex } from "await-semaphore";

function toKey<K>(key: K) {
  return JSON.stringify(key);
}

export class MemoryCache<K, V> {
  private cache: CacheMap<string, V>;
  private readonly mutex = new Mutex();

  constructor(ttlMs: number) {
    this.cache = new CacheMap(ttlMs);
  }

  get(key: K): V | undefined {
    return this.cache.get(toKey(key));
  }

  set(key: K, value: V): void {
    return this.cache.set(toKey(key), value);
  }

  invalidate(key: K): void {
    return this.cache.invalidate(toKey(key));
  }

  async use(key: K, setter: () => Promise<V>): Promise<V> {
    return this.mutex.use(async () => {
      const cached = this.get(key);
      if (cached) {
        return cached;
      } else {
        const value = await setter();
        this.set(key, value);
        return value;
      }
    });
  }
}
