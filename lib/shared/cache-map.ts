import { Mutex } from "await-semaphore";

export class CacheMap<K, V> {
  private expiration = new Map<K, number>();
  private values = new Map<K, V>();
  private readonly mutex = new Mutex();

  constructor(private readonly ttlMs: number) {}

  get(key: K): V | undefined {
    const now = new Date().valueOf();
    const expiration = this.expiration.get(key);
    const value = this.values.get(key);
    if (value && expiration && now > expiration) {
      return undefined;
    } else {
      return value;
    }
  }

  set(key: K, value: V): void {
    const now = new Date().valueOf();
    this.expiration.set(key, now + this.ttlMs);
    this.values.set(key, value);
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

  invalidate(key: K) {
    this.expiration.delete(key);
    this.values.delete(key);
  }
}
