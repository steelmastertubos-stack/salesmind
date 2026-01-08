import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PageHeader({ 
  title, 
  subtitle,
  actionLabel, 
  onAction,
  backTo,
  children
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {backTo && (
            <Link to={createPageUrl(backTo)}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {children}
          {actionLabel && onAction && (
            <Button onClick={onAction} className="bg-[#0F2A44] hover:bg-[#1F4E79]">
              <Plus className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}