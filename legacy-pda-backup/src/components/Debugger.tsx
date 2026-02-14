import { useEffect } from 'react';

export default function Debugger() {
    useEffect(() => {
        // Only initialize in development and only on client side
        if (import.meta.env.MODE !== 'development') return;

        // Use dynamic import to keep it out of the main bundle
        import('vconsole').then((VConsoleModule) => {
            const VConsole = VConsoleModule.default;
            const vConsole = new VConsole();
            console.log('vConsole initialized');

            // Clean up on unmount
            return () => {
                vConsole.destroy();
            };
        }).catch(err => {
            console.error('Failed to load vConsole:', err);
        });
    }, []);

    return null;
}
