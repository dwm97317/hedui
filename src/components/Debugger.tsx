import { useEffect } from 'react';
import VConsole from 'vconsole';

export default function Debugger() {
    useEffect(() => {
        // Only initialize if not already active
        const vConsole = new VConsole();

        // Log initial environment details
        console.log('vConsole initialized');
        console.log('User Agent:', navigator.userAgent);
        console.log('Current URL:', window.location.href);
        console.log('Base URL:', import.meta.env.BASE_URL);

        return () => {
            vConsole.destroy();
        };
    }, []);

    return null;
}
