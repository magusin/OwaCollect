import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export function useDarkMode() {
  return useContext(DarkModeContext);
}

export function DarkModeProvider({ children }) {
    // Initialiser l'état avec une fonction pour retarder l'évaluation
    const [darkMode, setDarkMode] = useState(() => {
      // Vérifier si window est défini pour s'assurer que le code s'exécute côté client
      if (typeof window !== 'undefined') {
        const storedDarkMode = localStorage.getItem('darkModeOWA');
        return storedDarkMode === 'true';
      }
      return false;
    });
  
    useEffect(() => {
      if (typeof window !== 'undefined') {
        // Récupérer l'état du dark mode à partir de localStorage
        const storedDarkMode = localStorage.getItem('darkModeOWA');
        const isDarkMode = storedDarkMode === 'true';
        setDarkMode(isDarkMode);
        document.body.classList.toggle('dark-mode', isDarkMode);
      }
    }, []);
  
    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkModeOWA', darkMode);
        document.body.classList.toggle('dark-mode', darkMode);
      }
    }, [darkMode]);
  
    const toggleDarkMode = () => setDarkMode(!darkMode);
  
    return (
      <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
        {children}
      </DarkModeContext.Provider>
    );
  }