import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('themeColor') || 'blue');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color', themeColor);
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
