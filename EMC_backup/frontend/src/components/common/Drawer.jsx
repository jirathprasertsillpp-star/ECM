import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children, width = '600px' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[4px] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div 
                className={`fixed top-0 right-0 h-full z-[101] bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col`}
                style={{ 
                    width: width, 
                    maxWidth: '100vw',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
                }}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-[var(--border-ultra-light)] flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md">
                    <h2 className="text-xl font-extrabold text-[var(--slate-900)] tracking-tight">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--slate-100)] text-[var(--text-muted)] hover:text-[var(--slate-900)] transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {children}
                </div>
            </div>
        </>
    );
}
