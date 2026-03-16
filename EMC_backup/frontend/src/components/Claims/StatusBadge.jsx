import React from 'react';
import { STATUS_MAP } from '../../utils/formatters';

const getModernStatusClass = (status) => {
    switch (status) {
        case 'approved': return 'badge-approved';
        case 'rejected': return 'badge-rejected';
        case 'pending_accounting':
        case 'pending_pco': return 'badge-pending';
        case 'info': return 'badge-info';
        default: return 'badge-draft';
    }
};

export default function StatusBadge({ status, className = '' }) {
    const config = STATUS_MAP[status] || STATUS_MAP.draft;
    const badgeClass = getModernStatusClass(status);

    return (
        <span className={`badge ${badgeClass} ${className}`}>
            {config.label}
        </span>
    );
}
