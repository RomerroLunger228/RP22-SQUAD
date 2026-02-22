'use client';

import { useState, useRef, useEffect } from "react";
import { PulseMap } from "./PulseSkeleleton";

export default function MapGoogle() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleLoad = () => {
        console.log('✅ Iframe loaded successfully');
        setIsLoading(false);
        setHasError(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    const handleError = () => {
        console.error('❌ Iframe failed to load');
        setIsLoading(false);
        setHasError(true);
    };

    useEffect(() => {
        // Таймаут на случай если iframe никогда не загрузится
        timeoutRef.current = setTimeout(() => {
            if (isLoading) {
                console.warn('⚠️ Iframe loading timeout');
                setIsLoading(false);
                setHasError(true);
            }
        }, 8000); // 8 секунд таймаут

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isLoading]);

    return (
        <div className="relative w-full min-h-[120px] ">
            {/* Скелетон пока грузится */}
            {isLoading && <PulseMap />}
            
            {/* Сообщение об ошибке */}
            {hasError && (
                <div className="text-center py-8 text-gray-400">
                    Sienna 90, Warszawa
                </div>
            )}

            {/* Карта */}
            <iframe 
                ref={iframeRef}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2443.742138717153!2d20.9911957!3d52.229902499999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecc9004a104c9%3A0xae631e19ed02524b!2zU2llbm5hIDkwLCAwMC04MTUgV2Fyc3phd2EsINCf0L7Qu9GM0YjQsA!5e0!3m2!1sru!2sby!4v1766880807159!5m2!1sru!2sby" 
                width="100%" 
                height="120" 
                loading="lazy"
                title="Google Maps Location"
                className={`
                    transition-all duration-500 rounded-xl
                    ${isLoading ? 'opacity-0 absolute' : 'opacity-100'}
                    ${hasError ? 'hidden' : ''}
                `}
                onLoad={handleLoad}
                onError={handleError}
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
            />
        </div>
    );
}