import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
    LayoutDashboard, 
    Users, 
    Building2, 
    FileText, 
    ShoppingCart, 
    BarChart3,
    Settings,
    Menu,
    X,
    Zap,
    MapPin,
    Target,
    Upload,
    CheckSquare,
    Package,
    DollarSign,
    Trophy
  } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TaskNotifications from '@/components/tasks/TaskNotifications';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  const navigationSections = [
    {
      title: 'VISÃO GERAL',
      items: [
        { name: 'Painel', icon: LayoutDashboard, page: 'Dashboard' }
      ]
    },
    {
      title: 'VENDAS',
      items: [
        { name: 'Orçamentos', icon: FileText, page: 'Quotes' },
        { name: 'CRM', icon: Target, page: 'Opportunities' },
        { name: 'Tarefas', icon: CheckSquare, page: 'Tasks' },
        { name: 'Pedidos', icon: ShoppingCart, page: 'Orders' }
      ]
    },
    {
      title: 'BASE COMERCIAL',
      items: [
        { name: 'Clientes', icon: Users, page: 'Clients' },
        { name: 'Produtos', icon: Package, page: 'Products' }
      ]
    },
    {
      title: 'FINANCEIRO',
      items: [
        { name: 'Financeiro', icon: DollarSign, page: 'Financeiro' },
        { name: 'Comissões', icon: BarChart3, page: 'Commissions' },
        { name: 'Representados', icon: Building2, page: 'Principals' }
      ]
    },
    {
      title: 'INTELIGÊNCIA',
      items: [
        { name: 'Relatórios', icon: BarChart3, page: 'Reports' },
        { name: 'Insights IA', icon: Zap, page: 'AIInsights' },
        { name: 'Ranking Clientes', icon: Trophy, page: 'ClientRanking' },
        { name: 'Gamificação', icon: Target, page: 'Gamification' }
      ]
    },
    {
      title: 'CONFIGURAÇÕES',
      items: [
        { name: 'Importar Dados', icon: Upload, page: 'ImportData' },
        { name: 'Recalcular Tags', icon: Zap, page: 'RecalculateTags' },
        { name: 'AutoTest', icon: CheckSquare, page: 'AutoTest' },
        { name: 'Modo Campo', icon: MapPin, page: 'FieldMode' },
        { name: 'Configurações', icon: Settings, page: 'Settings' }
      ]
    }
  ];

  const isActive = (page) => currentPageName === page;

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: #0F2A44;
          --primary-hover: #1F4E79;
          --action: #1DB954;
          --success: #2ECC71;
          --warning: #F1C40F;
          --danger: #E74C3C;
          --info: #3498DB;
          --text-primary: #1C1C1C;
          --bg-neutral: #F2F4F7;
        }

        body {
          background-color: var(--bg-neutral);
          color: var(--text-primary);
        }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0F2A44] text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Zap className="w-7 h-7 text-[#1DB954]" />
          <span className="font-bold text-lg">SalesMind</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-[#0F2A44] text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden lg:flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1DB954] rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">SalesMind</h1>
            <p className="text-xs text-slate-300">B2B Sales Intelligence</p>
          </div>
        </div>

        <nav className="mt-20 lg:mt-4 px-3 space-y-1 overflow-y-auto pb-24" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                  {navigationSections.map((section, sectionIdx) => (
                    <div key={section.title} className={sectionIdx > 0 ? 'mt-6 pt-4 border-t border-slate-600' : ''}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">
                        {section.title}
                      </p>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                              ${isActive(item.page) 
                                ? 'bg-[#1DB954] text-white shadow-lg' 
                                : 'text-slate-300 hover:bg-[#1F4E79] hover:text-white'}
                            `}
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>

        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-sm font-medium">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name || 'Usuário'}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen bg-[#F2F4F7]">
        <div className="p-4 lg:p-6">
          {children}
        </div>
        <TaskNotifications />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50">
        <div className="flex justify-around">
          {[
            { name: 'Painel', icon: LayoutDashboard, page: 'Dashboard' },
            { name: 'Orçamentos', icon: FileText, page: 'Quotes' },
            { name: 'CRM', icon: Target, page: 'Opportunities' },
            { name: 'Clientes', icon: Users, page: 'Clients' },
            { name: 'Financeiro', icon: DollarSign, page: 'Financeiro' }
          ].map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`
                flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all
                ${isActive(item.page) 
                  ? 'text-[#1DB954]' 
                  : 'text-slate-500'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}