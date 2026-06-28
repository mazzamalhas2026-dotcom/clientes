'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  FileSpreadsheet,
  Shirt,
  CheckCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DashboardData {
  totalClientes: number;
  totalPedidos: number;
  totalPecas: number;
  statusBreakdown: {
    AGUARDANDO_PREENCHIMENTO: number;
    EM_PREENCHIMENTO: number;
    FINALIZADO: number;
  };
  recentPedidos: any[];
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Erro ao carregar dados do dashboard');
        const resData = await response.json();
        setData(resData);
      } catch (err: any) {
        setError(err.message || 'Erro de conexão.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGUARDANDO_PREENCHIMENTO':
        return 'bg-amber-100 text-amber-850 dark:bg-amber-950/30 dark:text-amber-400';
      case 'EM_PREENCHIMENTO':
        return 'bg-sky-100 text-sky-850 dark:bg-sky-950/30 dark:text-sky-400';
      case 'FINALIZADO':
        return 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/30 dark:text-emerald-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AGUARDANDO_PREENCHIMENTO':
        return 'Aguardando';
      case 'EM_PREENCHIMENTO':
        return 'Em Preenchimento';
      case 'FINALIZADO':
        return 'Finalizado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
        <p className="text-sm text-slate-450">Carregando métricas do painel...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="font-semibold text-slate-805 dark:text-slate-200">Erro ao carregar dashboard</p>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grade de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Clientes */}
        <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm rounded-2xl transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider">Clientes Ativos</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{data.totalClientes}</div>
            <p className="text-[10px] text-slate-400 mt-1">Empresas e agremiações</p>
          </CardContent>
        </Card>

        {/* Total Pedidos */}
        <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm rounded-2xl transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider">Pedidos Totais</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-655 dark:text-sky-400 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{data.totalPedidos}</div>
            <p className="text-[10px] text-slate-400 mt-1">Lotes abertos e fechados</p>
          </CardContent>
        </Card>

        {/* Total Peças */}
        <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm rounded-2xl transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider">Peças Coletadas</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
              <Shirt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{data.totalPecas}</div>
            <p className="text-[10px] text-slate-400 mt-1">Tamanhos individuais preenchidos</p>
          </CardContent>
        </Card>

        {/* Pedidos Finalizados */}
        <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm rounded-2xl transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider">Finalizados</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              {data.statusBreakdown.FINALIZADO}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Prontos para produção</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Principal (Pedidos Recentes e Ações) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pedidos Recentes */}
        <Card className="lg:col-span-2 border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Pedidos Recentes</CardTitle>
              <CardDescription className="text-slate-450">Últimos lotes cadastrados no sistema.</CardDescription>
            </div>
            <Link href="/admin/pedidos">
              <Button variant="ghost" size="sm" className="rounded-lg text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer">
                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentPedidos.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Nenhum pedido recente cadastrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                    <TableRow>
                      <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-350">Pedido</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-350">Cliente</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-350">Descrição</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 dark:text-slate-350">Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPedidos.map((pedido) => (
                      <TableRow key={pedido.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <TableCell className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {pedido.numeroPedido}
                        </TableCell>
                        <TableCell className="text-slate-650 dark:text-slate-300 text-sm font-semibold">
                          {pedido.cliente?.nome}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 text-xs max-w-[150px] truncate">
                          {pedido.descricao}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(pedido.status)}`}>
                            {getStatusText(pedido.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/pedidos/${pedido.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md cursor-pointer">
                              <ArrowRight className="h-4 w-4 text-slate-400" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atalhos e Ações Rápidas */}
        <div className="space-y-6">
          <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Ações Rápidas</CardTitle>
              <CardDescription className="text-slate-450">Atalhos para fluxos comuns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/pedidos?new=true" className="block">
                <Button className="w-full justify-start rounded-xl py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" /> Criar Lote de Pedido
                </Button>
              </Link>
              <Link href="/admin/clientes?new=true" className="block">
                <Button variant="outline" className="w-full justify-start rounded-xl py-5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 cursor-pointer">
                  <Users className="mr-2 h-4 w-4 text-slate-450" /> Cadastrar Novo Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card status de preenchimento */}
          <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-indigo-600 text-white shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-indigo-200">Funil de Pedidos</span>
                <TrendingUp className="h-4 w-4 text-indigo-200" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-indigo-500/30 pb-2">
                  <span className="text-indigo-200">Aguardando</span>
                  <span className="font-extrabold">{data.statusBreakdown.AGUARDANDO_PREENCHIMENTO}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-indigo-500/30 pb-2">
                  <span className="text-indigo-200">Em Preenchimento</span>
                  <span className="font-extrabold">{data.statusBreakdown.EM_PREENCHIMENTO}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-1">
                  <span className="text-indigo-200">Finalizados</span>
                  <span className="font-extrabold">{data.statusBreakdown.FINALIZADO}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
