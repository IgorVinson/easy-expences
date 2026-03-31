import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';

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
  // Semantic colors
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
};

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  themePreference: 'auto' | 'dark' | 'light';
  toggleTheme: () => void;
  setThemePreference: (preference: 'auto' | 'dark' | 'light') => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<'auto' | 'dark' | 'light'>('auto');
  const isDarkMode = useMemo(() => {
    if (themePreference === 'auto') {
      return systemScheme === 'dark';
    }
    return themePreference === 'dark';
  }, [systemScheme, themePreference]);

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
    // Semantic colors
    success: '#10B981',
    successBg: isDarkMode ? 'rgba(16,185,129,0.15)' : '#D1FAE5',
    error: '#EF4444',
    errorBg: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEE2E2',
    warning: '#F59E0B',
    warningBg: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB',
    info: '#0EA5E9',
    infoBg: isDarkMode ? 'rgba(14,165,233,0.15)' : '#E0F2FE',
  };

  const toggleTheme = () => setThemePreference(isDarkMode ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, themePreference, setThemePreference }}>
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
