const STORAGE_KEY = 'techviz_groq_api_key';

/**
 * Lấy Groq API Key theo thứ tự ưu tiên:
 * 1. Biến môi trường Vite (.env.local -> VITE_GROQ_API_KEY)
 * 2. Lưu trữ trong trình duyệt (localStorage)
 */
export function getGroqApiKey(): string {
  // 1. Biến môi trường Vite
  try {
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    if (
      envKey &&
      typeof envKey === 'string' &&
      envKey.trim() !== '' &&
      !envKey.includes('your_actual_groq_api_key_here')
    ) {
      return envKey.trim();
    }
  } catch {
    // Ignore in non-Vite environments
  }

  // 2. Fallback sang localStorage nếu người dùng nhập qua UI
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localKey = window.localStorage.getItem(STORAGE_KEY);
      if (localKey && localKey.trim() !== '') {
        return localKey.trim();
      }
    } catch {
      // Ignore if localStorage is disabled
    }
  }

  return '';
}

export function setGroqApiKey(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, key.trim());
    } catch {
      // Ignore
    }
  }
}

export function clearGroqApiKey(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

export function hasGroqApiKey(): boolean {
  return getGroqApiKey().length > 0;
}

export function getApiKeySource(): 'env' | 'local' | 'none' {
  try {
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    if (
      envKey &&
      typeof envKey === 'string' &&
      envKey.trim() !== '' &&
      !envKey.includes('your_actual_groq_api_key_here')
    ) {
      return 'env';
    }
  } catch {
    //
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localKey = window.localStorage.getItem(STORAGE_KEY);
      if (localKey && localKey.trim() !== '') {
        return 'local';
      }
    } catch {
      //
    }
  }

  return 'none';
}
