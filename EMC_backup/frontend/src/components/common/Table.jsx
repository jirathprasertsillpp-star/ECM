import React from 'react';

export default function Table({
    columns,
    data,
    onRowClick,
    loading = false,
    emptyMessage = 'ไม่พบข้อมูล'
}) {
    if (loading) {
        return (
            <div className="table-wrapper flex flex-col items-center justify-center p-20 text-primary-600 bg-surface-base">
                <div className="spinner mb-4"></div>
                <span className="font-semibold text-sm">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="table-wrapper">
                <div className="empty-state">
                    <div className="empty-icon font-display text-4xl">📭</div>
                    <p className="empty-title">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className={col.headerClassName || ''}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr
                                key={row.id || rowIndex}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={onRowClick ? 'cursor-pointer' : ''}
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className={col.cellClassName || ''}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
