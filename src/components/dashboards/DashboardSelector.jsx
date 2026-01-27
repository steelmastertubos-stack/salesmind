import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Plus, Star, Edit, Trash2, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardSelector({ 
  dashboards = [], 
  activeDashboard, 
  onSelect, 
  onNew, 
  onEdit, 
  onDelete,
  currentUser 
}) {
  const myDashboards = dashboards.filter(d => d.owner_email === currentUser?.email);
  const sharedDashboards = dashboards.filter(d => d.is_shared && d.owner_email !== currentUser?.email);
  const favorites = dashboards.filter(d => d.is_favorite);

  return (
    <div className="bg-white rounded-lg p-4 border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Dashboards Personalizados
        </h3>
        <Button size="sm" onClick={onNew} className="bg-[#1DB954] hover:bg-[#1DB954]/90">
          <Plus className="w-4 h-4 mr-2" />
          Novo Dashboard
        </Button>
      </div>

      {/* Favoritos */}
      {favorites.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">⭐ Favoritos</p>
          <div className="flex flex-wrap gap-2">
            {favorites.map(d => (
              <Button
                key={d.id}
                variant={activeDashboard?.id === d.id ? "default" : "outline"}
                size="sm"
                onClick={() => onSelect(d)}
                className={activeDashboard?.id === d.id ? "bg-[#0F2A44]" : ""}
              >
                <Star className="w-3 h-3 mr-1 fill-current" />
                {d.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Meus Dashboards */}
      <div>
        <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Meus Dashboards</p>
        <div className="space-y-2">
          {myDashboards.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nenhum dashboard criado</p>
          ) : (
            myDashboards.map(d => (
              <div
                key={d.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                  ${activeDashboard?.id === d.id 
                    ? 'bg-slate-50 border-[#0F2A44]' 
                    : 'hover:bg-slate-50 border-slate-200'}
                `}
                onClick={() => onSelect(d)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{d.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {d.dashboard_type}
                    </Badge>
                    {d.is_shared && <Share2 className="w-3 h-3 text-slate-400" />}
                  </div>
                  {d.description && (
                    <p className="text-xs text-slate-500 mt-1">{d.description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span>{d.selected_kpis?.length || 0} KPIs</span>
                    <span>•</span>
                    <span>{d.selected_charts?.length || 0} Gráficos</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      ⋯
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(d)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(d)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dashboards Compartilhados */}
      {sharedDashboards.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Compartilhados pela equipe</p>
          <div className="space-y-2">
            {sharedDashboards.map(d => (
              <div
                key={d.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                  ${activeDashboard?.id === d.id 
                    ? 'bg-slate-50 border-[#1DB954]' 
                    : 'hover:bg-slate-50 border-slate-200'}
                `}
                onClick={() => onSelect(d)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{d.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {d.dashboard_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    por {d.owner_email}
                  </p>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  );
}