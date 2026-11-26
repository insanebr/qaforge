'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { lightTheme, darkTheme } from '@/theme/themeConfig';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('tm_theme_mode') as ThemeMode;
    if (savedTheme) {
      setMode(savedTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    localStorage.setItem('tm_theme_mode', nextMode);
  };

  const currentTheme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ConfigProvider theme={currentTheme} locale={ptBR}>
        <div data-theme={mode} style={{ minHeight: '100vh', opacity: mounted ? 1 : 0, transition: 'opacity 0.15s ease' }}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
