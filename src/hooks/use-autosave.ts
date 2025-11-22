import { useEffect, useRef } from 'react';

export function useAutosave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 1500,
  enabled: boolean = true
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  useEffect(() => {
    if (!enabled) return;

    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        saveFunction(data).catch(error => {
          console.error('Автосохранение не удалось:', error);
        });
      }, delay);

      previousDataRef.current = data;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay, enabled]);
}
