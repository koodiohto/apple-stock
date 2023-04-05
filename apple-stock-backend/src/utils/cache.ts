interface CacheEntry<T> {
    data: T;
    timestamp: number;
  }
  
  interface Cache<T> {
    [key: string]: CacheEntry<T>;
  }
  
  interface CacheConfig {
    duration: number;
  }
  
  export default class SimpleCache<T> {
    private cache: Cache<T>;
    private readonly duration: number;
  
    constructor(config: CacheConfig) {
      this.cache = {};
      this.duration = config.duration;
    }
  
    public get(key: string): T | null {
      const entry = this.cache[key];
  
      if (entry && Date.now() - entry.timestamp < this.duration) {
        return entry.data;
      }
  
      return null;
    }
  
    public put(key: string, data: T): void {
      this.cache[key] = { data, timestamp: Date.now() };
    }
  
    public delete(key: string): void {
      delete this.cache[key];
    }
  }