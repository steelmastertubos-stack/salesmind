import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// periodType: 'month' | 'quarter' | 'year'
export default function MonthPeriodSelector({ selectedMonth, selectedYear, periodType = 'month', onChange, onPeriodTypeChange }) {
  const now = new Date();
  const isCurrentPeriod = selectedMonth === now.getMonth() && selectedYear === now.getFullYear() && periodType === 'month';

  const goToPrev = () => {
    if (periodType === 'year') {
      onChange(selectedMonth, selectedYear - 1);
    } else if (periodType === 'quarter') {
      const currentQ = Math.floor(selectedMonth / 3);
      if (currentQ === 0) onChange(9, selectedYear - 1);
      else onChange((currentQ - 1) * 3, selectedYear);
    } else {
      if (selectedMonth === 0) onChange(11, selectedYear - 1);
      else onChange(selectedMonth - 1, selectedYear);
    }
  };

  const goToNext = () => {
    if (periodType === 'year') {
      onChange(selectedMonth, selectedYear + 1);
    } else if (periodType === 'quarter') {
      const currentQ = Math.floor(selectedMonth / 3);
      if (currentQ === 3) onChange(0, selectedYear + 1);
      else onChange((currentQ + 1) * 3, selectedYear);
    } else {
      if (selectedMonth === 11) onChange(0, selectedYear + 1);
      else onChange(selectedMonth + 1, selectedYear);
    }
  };

  const goToCurrent = () => {
    onChange(now.getMonth(), now.getFullYear());
    onPeriodTypeChange?.('month');
  };

  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }

  const periodLabel = () => {
    if (periodType === 'year') return `Ano ${selectedYear}`;
    if (periodType === 'quarter') {
      const q = Math.floor(selectedMonth / 3) + 1;
      return `T${q} ${selectedYear}`;
    }
    return null;
  };

  const label = periodLabel();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Period type toggles */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {['month', 'quarter', 'year'].map((type) => {
          const labels = { month: 'Mês', quarter: 'Trimestre', year: 'Ano' };
          return (
            <button
              key={type}
              onClick={() => onPeriodTypeChange?.(type)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                periodType === type
                  ? 'bg-[#0F2A44] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      {/* Navigator */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 px-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {label ? (
            <span className="text-sm font-semibold text-slate-700 px-1">{label}</span>
          ) : (
            <>
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => onChange(parseInt(v), selectedYear)}
              >
                <SelectTrigger className="border-0 shadow-none h-7 text-sm font-semibold text-slate-700 w-[110px] p-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(selectedYear)}
                onValueChange={(v) => onChange(selectedMonth, parseInt(v))}
              >
                <SelectTrigger className="border-0 shadow-none h-7 text-sm font-semibold text-slate-700 w-[70px] p-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {!isCurrentPeriod && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrent}
          className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Mês Atual
        </Button>
      )}
    </div>
  );
}