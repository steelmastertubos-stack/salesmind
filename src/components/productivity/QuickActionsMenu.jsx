import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Zap, LayoutDashboard, Users, FileText, Target, DollarSign, Settings, Zap as ZapIcon } from 'lucide-react';

export default function QuickActionsMenu() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setUserRole(userData.role || 'user');
      } catch (e) {
        setUserRole('user');
      }
    };
    loadUser();
  }, []);

  // Quick actions por role
  const getQuickActions = () => {
    if (userRole === 'admin') {
      return {
        title: '⚙️ Admin',
        items: [
          { icon: Settings, label: 'Auditoria', page: 'AuditComplete' },
          { icon: ZapIcon, label: 'Automações', page: 'AutoTest' },
          { icon: Users, label: 'Importar', page: 'ImportData' },
          { icon: Settings, label: 'Configurações', page: 'Settings' }
        ]
      };
    } else if (userRole === 'gestor' || userRole === 'manager') {
      return {
        title: '📊 Gestor',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', page: 'Dashboard' },
          { icon: FileText, label: 'Relatórios', page: 'Reports' },
          { icon: Target, label: 'Ranking', page: 'ClientRanking' },
          { icon: DollarSign, label: 'Financeiro', page: 'Financeiro' }
        ]
      };
    } else {
      // Vendedor (user)
      return {
        title: '🚀 Vendedor',
        items: [
          { icon: LayoutDashboard, label: 'Painel', page: 'Dashboard' },
          { icon: Target, label: 'Oportunidades', page: 'Opportunities' },
          { icon: Users, label: 'Clientes', page: 'Clients' },
          { icon: FileText, label: 'Orçamentos', page: 'Quotes' }
        ]
      };
    }
  };

  const actions = getQuickActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          title={actions.title}
        >
          <Zap className="h-5 w-5 text-yellow-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-center py-2 border-b">
          {actions.title}
        </DropdownMenuLabel>

        {actions.items.map((item, idx) => (
          <Link key={idx} to={createPageUrl(item.page)}>
            <DropdownMenuItem className="cursor-pointer">
              <item.icon className="w-4 h-4 mr-2" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          </Link>
        ))}

        {userRole === 'user' && (
          <>
            <DropdownMenuSeparator />
            <Link to={createPageUrl('Tasks')}>
              <DropdownMenuItem className="cursor-pointer">
                <span className="text-sm">📋 Tarefas</span>
              </DropdownMenuItem>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}