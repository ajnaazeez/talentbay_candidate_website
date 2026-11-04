import { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme; // Effective active theme ('light' | 'dark')
  themeMode: ThemeMode; // User preference ('light' | 'dark' | 'system')
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

