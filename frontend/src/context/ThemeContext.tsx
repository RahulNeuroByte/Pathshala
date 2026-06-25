import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'normal' | 'dark' | 'oiled' | 'night';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'normal' || saved === 'oiled' || saved === 'night') {
      return saved as Theme;
    }
    // Default to dark mode for premium look
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('dark', 'oiled', 'night');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'oiled') {
      root.classList.add('dark', 'oiled');
    } else if (theme === 'night') {
      root.classList.add('dark', 'night');
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'normal') return 'dark';
      if (prev === 'dark') return 'oiled';
      if (prev === 'oiled') return 'night';
      return 'normal';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
