import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSuggestedAction } from './useSuggestedAction';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function SuggestedActionCard() {
  const { suggestedAction, isLoading } = useSuggestedAction();

  if (isLoading) {
    return (
      <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-slate-600">Analisando ações...</span>
        </CardContent>
      </Card>
    );
  }

  const { icon, title, message, actionLabel, filterPage, color } = suggestedAction;

  return (
    <Card className={`border-2 border-transparent bg-gradient-to-br ${color} shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="text-4xl flex-shrink-0 mt-1">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-white/90 mb-4 leading-relaxed">
              {message}
            </p>

            {/* CTA Button */}
            <Link to={createPageUrl(filterPage)}>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                {actionLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}