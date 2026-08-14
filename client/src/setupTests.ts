// Node 26+ expose un `localStorage` global experimental qui prend le pas sur
// celui de jsdom sans le flag --localstorage-file, laissant
// `window.localStorage` a `undefined` dans les tests. On le remplace par une
// implementation en memoire, suffisante pour les tests (pas besoin de
// persistance disque).
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(window, "localStorage", { value: new MemoryStorage(), configurable: true });
