import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = {
  bg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  iconBg: string;
  purple: string;
  purpleCard: string;
  isDark: boolean;
  expenseIconBg: (colorLight: string, colorDark: string) => string;
  expenseIconColor: (colorDark: string) => string;
};

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme: Theme = {
    bg: isDarkMode ? '#020617' : '#F9FAFB',
    cardBg: isDarkMode ? '#0F172A' : '#FFFFFF',
    textPrimary: isDarkMode ? '#FFFFFF' : '#0F172A',
    textSecondary: isDarkMode ? '#94A3B8' : '#475569',
    textTertiary: isDarkMode ? '#64748B' : '#94A3B8',
    border: isDarkMode ? '#1E293B' : '#E2E8F0',
    iconBg: isDarkMode ? '#1E293B' : '#F1F5F9',
    purple: isDarkMode ? '#7C3AED' : '#8B5CF6',
    purpleCard: isDarkMode ? '#6D28D9' : '#7C3AED',
    isDark: isDarkMode,
    expenseIconBg: (colorLight: string, colorDark: string) =>
      isDarkMode ? colorDark + '33' : colorLight,
    expenseIconColor: (colorDark: string) => colorDark,
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
