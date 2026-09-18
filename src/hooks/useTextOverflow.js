import { useEffect, useRef, useState } from 'react';

export const useTextOverflow = () => {
  const elementRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const checkOverflow = () => {
      const isOverflow = element.scrollWidth > element.offsetWidth;
      setIsOverflowing(isOverflow);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  return { elementRef, isOverflowing };
};