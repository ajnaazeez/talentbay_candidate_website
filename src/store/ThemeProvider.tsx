import React, { useState, useEffect, useCallback } from 'react';
import { ThemeContext, type Theme, type ThemeMode } from './ThemeContext';

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Store user-selected mode ('light' | 'dark' | 'system')
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem('talentbay_theme') as ThemeMode;
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  });

  // Effective active theme applied to HTML root
  const [theme, setActiveTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('talentbay_theme') as ThemeMode;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Function to resolve system preference
  const resolveActiveTheme = useCallback((mode: ThemeMode): Theme => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }, []);

  // Update effective theme and apply dark class
  useEffect(() => {
    const resolved = resolveActiveTheme(themeMode);
    setActiveTheme(resolved);

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('talentbay_theme', themeMode);
  }, [themeMode, resolveActiveTheme]);

  // Listen to OS preference changes when themeMode is 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        const resolved: Theme = e.matches ? 'dark' : 'light';
        setActiveTheme(resolved);
        const root = document.documentElement;
        if (resolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const currentResolved = resolveActiveTheme(prev);
      return currentResolved === 'light' ? 'dark' : 'light';
    });
  };

  const setTheme = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

