/**
 * UI Preferences Safe Storage Wrapper
 * 
 * Used strictly for transient UI conveniences (theme, active tabs, filters).
 * All domain data must reside in Supabase as the single source of truth.
 */

export const uiStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`iedc_ui_${key}`);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn(`[uiStorage] Failed to read key "${key}":`, err);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`iedc_ui_${key}`, JSON.stringify(value));
    } catch (err) {
      console.warn(`[uiStorage] Failed to save key "${key}":`, err);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`iedc_ui_${key}`);
    } catch (err) {
      console.warn(`[uiStorage] Failed to remove key "${key}":`, err);
    }
  }
};
