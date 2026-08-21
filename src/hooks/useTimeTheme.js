import { useEffect, useState } from 'react';

/**
 * Calculates current theme based on local hour:
 * Dawn  (5 AM - 9 AM)
 * Day   (9 AM - 5 PM)
 * Dusk  (5 PM - 8 PM)
 * Night (8 PM - 5 AM)
 */
const getThemeByHour = (hour) => {
    if (hour >= 5 && hour < 9) return 'dawn';
    if (hour >= 9 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
};

export function useTimeTheme() {
    const [theme, setTheme] = useState(() => getThemeByHour(new Date().getHours()));

    useEffect(() => {
        const updateTheme = () => {
            const currentTheme = getThemeByHour(new Date().getHours());
            setTheme(currentTheme);
            document.documentElement.setAttribute('data-theme', currentTheme);
        };

        updateTheme();
        // Re-check theme every 5 minutes
        const interval = setInterval(updateTheme, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { theme };
}