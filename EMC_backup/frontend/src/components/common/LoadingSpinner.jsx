import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
    let finalSizeClass = 'w-6 h-6';
    switch (size) {
        case 'sm': finalSizeClass = 'w-4 h-4'; break;
        case 'lg': finalSizeClass = 'w-10 h-10'; break;
        case 'xl': finalSizeClass = 'w-16 h-16'; break;
        default: break;
    }

    return (
        <Loader2 className={`animate-spin text-primary ${finalSizeClass} ${className}`} />
    );
}
