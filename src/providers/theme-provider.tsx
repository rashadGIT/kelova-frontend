'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('kelova-theme') as Theme | null;
    const preferred = saved ?? 'light';
    setTheme(preferred);
    document.documentElement.classList.toggle('dark', preferred === 'dark');
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('kelova-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
