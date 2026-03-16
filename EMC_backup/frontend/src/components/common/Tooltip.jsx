import React, { useState } from 'react';

/**
 * Premium Tooltip Component
 * @param {string} text - The tooltip text
 * @param {React.ReactNode} children - The element to wrap
 * @param {string} position - top, bottom, left, right
 */
export default function Tooltip({ text, children, position = 'top' }) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--slate-800)]',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--slate-800)]',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--slate-800)]',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--slate-800)]'
    };

    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            
            {isVisible && text && (
                <div className={`absolute z-[9999] px-3 py-1.5 text-xs font-semibold text-white bg-[var(--slate-800)] rounded-lg shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-200 whitespace-nowrap border border-white/10 ${positionClasses[position]}`}>
                    {text}
                    <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`}></div>
                </div>
            )}
        </div>
    );
}
