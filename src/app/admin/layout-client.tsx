'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: {
    nome: string;
    email: string;
  };
}

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    {
      nome: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      nome: 'Clientes',
      href: '/admin/clientes',
      icon: Users,
    },
    {
      nome: 'Pedidos',
      href: '/admin/pedidos',
      icon: FileSpreadsheet,
    },
    {
      nome: 'Configurações',
      href: '/admin/configuracoes',
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/admin/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const activePageName = menuItems.find(item => pathname.startsWith(item.href))?.nome || 'Painel';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 print:hidden">
        {/* Logo Mazza Malhas */}
        <div className="h-20 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-900">
          <div className="relative w-14 h-14 shrink-0">
            <Image
              src="/logo-mazza.png"
              alt="Mazza Malhas"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-[15px] text-slate-800 dark:text-white tracking-tight">MAZZA MALHAS</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase">Painel Administrativo</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group active:scale-98 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                }`} />
                {item.nome}
              </Link>
            );
          })}
        </nav>

        {/* User Info footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm">
              {getInitials(user.nome)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user.nome}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer (Sidebar móvel) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in print:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 animate-slide-in-left">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Logo Mazza Malhas - mobile */}
            <div className="flex items-center gap-3 mb-8 mt-2">
              <div className="relative w-12 h-12 shrink-0">
                <Image
                  src="/logo-mazza.png"
                  alt="Mazza Malhas"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-[14px] text-slate-800 dark:text-white tracking-tight">MAZZA MALHAS</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Painel Admin</span>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.nome}
                  </Link>
                );
              })}
            </nav>

            {/* User Info footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                  {getInitials(user.nome)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user.nome}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-300 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 md:hidden focus:outline-none cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize tracking-tight">
              {activePageName}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="h-9 w-9 rounded-full p-0 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  />
                }
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-350 text-xs font-semibold">
                  {getInitials(user.nome)}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-850 dark:text-slate-250">{user.nome}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-850" />
                <DropdownMenuItem
                  onClick={() => router.push('/admin/configuracoes')}
                  className="cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <Settings className="mr-2 h-4 w-4 text-slate-400" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-850" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Child Pages container */}
        <main className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto animate-fade-in print:max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
