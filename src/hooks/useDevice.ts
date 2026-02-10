import { useState, useEffect } from 'react';

export function useDevice() {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [isPDA, setIsPDA] = useState(window.innerWidth <= 720);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
            setIsPDA(window.innerWidth <= 720);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { isMobile, isPDA };
}
