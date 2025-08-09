import React, { useState, useEffect } from 'react';

/**
 * A custom hook that persists state to localStorage.
 * It behaves like useState but automatically saves the state to localStorage on change
 * and loads it on initial render.
 * @param key The key to use in localStorage.
 * @param initialValue The initial value if nothing is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                return JSON.parse(storedValue);
            }
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
        }
        return initialValue;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export default usePersistentState;
