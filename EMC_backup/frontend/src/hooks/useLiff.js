import { useState, useEffect } from 'react';
import liff from '@line/liff';

export const useLiff = () => {
    const [lineProfile, setLineProfile] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initLiff = async () => {
            try {
                // Use a default or environment variable LIFF ID
                const liffId = import.meta.env.VITE_LIFF_ID || "1234567890-test";
                
                await liff.init({ liffId });
                setIsReady(true);
                
                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile();
                    setLineProfile(profile);
                } else {
                    liff.login();
                }
            } catch (err) {
                console.error('LIFF init failed', err);
                setError(err);
            }
        };
        
        initLiff();
    }, []);

    return { liff, lineProfile, isReady, error };
};
