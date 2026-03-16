import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    loading = false,
    disabled = false,
    className = '',
    onClick,
    icon: Icon,
    ...props
}) {
    const getVariantClass = () => {
        switch (variant) {
            case 'primary': return 'btn-primary';
            case 'accent': return 'btn-accent';
            case 'success': return 'btn-success';
            case 'danger': return 'btn-danger';
            case 'ghost': return 'btn-ghost';
            default: return 'btn-primary';
        }
    };

    const getSizeClass = () => {
        switch (size) {
            case 'sm': return 'btn-sm';
            case 'lg': return 'btn-lg';
            case 'icon': return 'btn-icon';
            default: return '';
        }
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`btn ${getVariantClass()} ${getSizeClass()} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!loading && Icon && <Icon className={size === 'icon' ? 'w-5 h-5' : 'w-4 h-4'} />}
            {size !== 'icon' && children}
        </button>
    );
}
