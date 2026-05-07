import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthPeriodSelector({ selectedMonth, selectedYear, onChange }) {
  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const goToPrev = () => {
    if (selectedMonth === 0) {
      onChange(11, selectedYear - 1);
    } else {
      onChange(selectedMonth - 1, selectedYear);
    }
  };

  const goToNext = () => {
    if (selectedMonth === 11) {
      onChange(0, selectedYear + 1);
    } else {
      onChange(selectedMonth + 1, selectedYear);
    }
  };

  const goToCurrentMonth = () => {
    onChange(now.getMonth(), now.getFullYear());
  };

  // Anos disponíveis: 3 anos atrás até ano atual + 1
  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 px-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
        </div>

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentMonth}
          className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Mês Atual
        </Button>
      )}
    </div>
  );
}