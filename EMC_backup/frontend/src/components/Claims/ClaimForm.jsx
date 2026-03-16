import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, AlignLeft, Hash } from 'lucide-react';
import { claimSchema } from '../../utils/validators';
import { formatDateInput } from '../../utils/formatters';

export default function ClaimForm({ initialData, onSubmit, loading, isDraft }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(claimSchema),
        defaultValues: {
            project_name: initialData?.project_name || '',
            project_code: initialData?.project_code || '',
            claim_month: formatDateInput(initialData?.claim_month) || '',
            notes: initialData?.notes || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="form-group">
                    <label htmlFor="project_name" className="form-label">Project Vector Name <span className="text-rose-500">*</span></label>
                    <div className="input-wrapper">
                        <FileText className="input-icon-left" size={18} />
                        <input
                            id="project_name"
                            className={`form-input has-left-icon ${errors.project_name ? 'border-rose-500 bg-rose-50' : ''}`}
                            placeholder="e.g. ERP CORE SYSTEM v2"
                            disabled={!isDraft}
                            {...register('project_name')}
                        />
                    </div>
                    {errors.project_name && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-1">{errors.project_name.message}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="project_code" className="form-label">Identification Code</label>
                    <div className="input-wrapper">
                        <Hash className="input-icon-left" size={18} />
                        <input
                            id="project_code"
                            className={`form-input has-left-icon ${errors.project_code ? 'border-rose-500 bg-rose-50' : ''}`}
                            placeholder="PRJ-2026-X"
                            disabled={!isDraft}
                            {...register('project_code')}
                        />
                    </div>
                    {errors.project_code && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-1">{errors.project_code.message}</p>}
                </div>
            </div>

            <div className="form-group max-w-sm">
                <label htmlFor="claim_month" className="form-label">Temporal Window <span className="text-rose-500">*</span></label>
                <div className="input-wrapper">
                    <Calendar className="input-icon-left" size={18} />
                    <input
                        id="claim_month"
                        type="date"
                        className={`form-input has-left-icon ${errors.claim_month ? 'border-rose-500 bg-rose-50' : ''}`}
                        disabled={!isDraft}
                        {...register('claim_month')}
                    />
                </div>
                {errors.claim_month && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-1">{errors.claim_month.message}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="notes" className="form-label">Supplemental Intelligence</label>
                <div className="relative">
                    <AlignLeft className="absolute left-5 top-5 text-slate-400 pointer-events-none" size={18} />
                    <textarea
                        id="notes"
                        className={`form-input has-left-icon min-h-[160px] pt-4 ${errors.notes ? 'border-rose-500 bg-rose-50' : ''}`}
                        placeholder="Additional operational context..."
                        disabled={!isDraft}
                        {...register('notes')}
                    />
                </div>
                {errors.notes && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-1">{errors.notes.message}</p>}
            </div>

            {isDraft && (
                <div className="flex justify-end pt-8 mt-10 border-t border-black/5">
                    <button type="submit" className={`btn btn-accent ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {initialData ? 'Commit Delta' : 'Initialize & Proceed'}
                    </button>
                </div>
            )}
        </form>
    );
}
