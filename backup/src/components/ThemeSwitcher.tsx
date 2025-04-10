'use client';

import { useState, useEffect } from 'react';
import { themeChange } from 'theme-change';

// Keep this list to iterate and create buttons
const DAISYUI_THEMES = [
    "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", 
    "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", 
    "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", 
    "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", 
    "night", "coffee", "winter", "dim", "nord", "sunset"
];

const ThemeSwitcher = () => {
  // Add state back for UI feedback
  const [currentTheme, setCurrentTheme] = useState(''); 

  useEffect(() => {
    themeChange(false); 
    // Set initial theme state for UI
    const initialTheme = localStorage.getItem('theme') || 'luxury';
    setCurrentTheme(initialTheme);

    // Listen for storage changes to keep UI synced if theme changes elsewhere
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        setCurrentTheme(event.newValue || 'luxury');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  return (
    <div title="Change Theme" className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost normal-case">
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current md:h-6 md:w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
            <span className="hidden md:inline">Theme</span> 
            <svg width="12px" height="12px" className="ml-1 hidden h-3 w-3 fill-current opacity-60 sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
                <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
            </svg>
        </div>
        <div tabIndex={0} className="dropdown-content bg-base-200 text-base-content rounded-box top-px max-h-96 h-[70vh] w-52 overflow-y-auto shadow mt-16 z-50">
            <div className="grid grid-cols-1 gap-3 p-3">
                {DAISYUI_THEMES.map((t) => (
                    <button
                        key={t}
                        // Add class logic back for checkmark
                        className={`outline-base-content overflow-hidden rounded-lg text-left ${currentTheme === t ? '[&_svg]:visible' : ''}`}
                        data-set-theme={t}
                        // Add onClick back to update local state for immediate checkmark
                        onClick={() => setCurrentTheme(t)} 
                    >
                        <div data-theme={t} className="bg-base-100 text-base-content w-full cursor-pointer font-sans">
                            <div className="grid grid-cols-5 grid-rows-3">
                                <div className="col-span-5 row-span-3 row-start-1 flex items-center gap-2 px-4 py-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="invisible h-3 w-3 shrink-0">
                                        <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"></path>
                                    </svg>
                                    <div className="flex-grow text-sm capitalize">{t}</div> 
                                    <div className="flex h-full flex-shrink-0 flex-wrap gap-1">
                                        <div className="bg-primary w-2 rounded"></div> 
                                        <div className="bg-secondary w-2 rounded"></div> 
                                        <div className="bg-accent w-2 rounded"></div> 
                                        <div className="bg-neutral w-2 rounded"></div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ThemeSwitcher; 