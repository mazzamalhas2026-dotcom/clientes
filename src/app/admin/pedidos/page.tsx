'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PedidoSchema, PedidoInput, Pedido, PedidoStatus } from '@/features/pedidos/types';
import { Cliente } from '@/features/clientes/types';
import {
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PedidosPage() {
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados dos Modais
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingPedido, setEditingPedido] = React.useState<Pedido | null>(null);
  const [deletingPedido, setDeletingPedido] = React.useState<Pedido | null>(null);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(PedidoSchema),
    defaultValues: {
      clienteId: '',
      descricao: '',
      quantidadePrevista: 10,
      observacoes: '',
      tipoColeta: 'NOMINAL',
      tipoProduto: 'APENAS_CAMISA',
    },
  });

  const selectedClienteId = watch('clienteId');
  const selectedTipoColeta = watch('tipoColeta');
  const selectedTipoProduto = watch('tipoProduto');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Carregar pedidos
      const resPedidos = await fetch('/api/pedidos');
      if (!resPedidos.ok) throw new Error('Erro ao carregar pedidos');
      const dataPedidos = await resPedidos.json();
      setPedidos(dataPedidos);

      // Carregar clientes ativos para o select no cadastro
      const resClientes = await fetch('/api/clientes');
      if (!resClientes.ok) throw new Error('Erro ao carregar clientes');
      const dataClientes = await resClientes.json();
      setClientes(dataClientes);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    reset({
      clienteId: '',
      descricao: '',
      quantidadePrevista: 10,
      observacoes: '',
      tipoColeta: 'NOMINAL',
      tipoProduto: 'APENAS_CAMISA',
    });
    setEditingPedido(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setValue('clienteId', pedido.clienteId);
    setValue('descricao', pedido.descricao);
    setValue('quantidadePrevista', pedido.quantidadePrevista);
    setValue('observacoes', pedido.observacoes || '');
    setValue('tipoColeta', pedido.tipoColeta || 'NOMINAL');
    setValue('tipoProduto', pedido.tipoProduto || 'APENAS_CAMISA');
    setIsCreateOpen(true);
  };

  const handleOpenDelete = (pedido: Pedido) => {
    setDeletingPedido(pedido);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitLoading(true);
    setError(null);
    try {
      const url = editingPedido ? `/api/pedidos/${editingPedido.id}` : '/api/pedidos';
      const method = editingPedido ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Erro ao salvar pedido');
      }

      setIsCreateOpen(false);
      reset();
      setEditingPedido(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPedido) return;
    setIsSubmitLoading(true);
    try {
      const response = await fetch(`/api/pedidos/${deletingPedido.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar pedido');
      
      setDeletingPedido(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = window.location.origin;
    const link = `${origin}/pedido/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const handleSendWhatsApp = (pedido: Pedido) => {
    if (!pedido.cliente?.whatsapp) return;
    const origin = window.location.origin;
    const link = `${origin}/pedido/${pedido.token}`;
    
    const text = `Olá ${pedido.cliente.responsavel}! Segue o link para preenchimento dos tamanhos do seu pedido (${pedido.numeroPedido} - ${pedido.descricao}):\n\n${link}\n\nPor favor, preencha a lista o quanto antes. Qualquer dúvida, estou à disposição!`;
    
    const cleanPhone = pedido.cliente.whatsapp.replace(/\D/g, '');
    const waUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`;
    
    window.open(waUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case PedidoStatus.AGUARDANDO_PREENCHIMENTO:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-450 border border-amber-200 dark:border-amber-900/50';
      case PedidoStatus.EM_PREENCHIMENTO:
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/30 dark:text-sky-450 border border-sky-200 dark:border-sky-900/50';
      case PedidoStatus.FINALIZADO:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case PedidoStatus.AGUARDANDO_PREENCHIMENTO:
        return 'Aguardando Preenchimento';
      case PedidoStatus.EM_PREENCHIMENTO:
        return 'Em Preenchimento';
      case PedidoStatus.FINALIZADO:
        return 'Finalizado';
      default:
        return status;
    }
  };

  const filteredPedidos = pedidos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.numeroPedido.toLowerCase().includes(term) ||
      p.descricao.toLowerCase().includes(term) ||
      p.cliente?.nome.toLowerCase().includes(term) ||
      p.cliente?.responsavel.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Topo com ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Pesquisar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-visible:ring-indigo-500"
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Pedido
        </Button>
      </div>

      {/* Lista de Pedidos */}
      <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">Pedidos Cadastrados</CardTitle>
          <CardDescription className="text-slate-550 dark:text-slate-400">
            Acompanhe o preenchimento das listas de tamanhos de cada lote de produção.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
              <p className="text-sm text-slate-450">Carregando dados dos pedidos...</p>
            </div>
          ) : filteredPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mb-2">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum pedido encontrado</p>
              <p className="text-sm text-slate-450 max-w-xs">
                {searchTerm ? 'Nenhum resultado corresponde à pesquisa.' : 'Comece cadastrando um novo pedido para seus clientes.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Pedido</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Cliente</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Descrição</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-center">Formato</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-center">Previsto</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Link Cliente</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPedidos.map((pedido) => (
                    <TableRow key={pedido.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-100">
                        {pedido.numeroPedido}
                      </TableCell>
                      <TableCell className="text-slate-650 dark:text-slate-300">
                        <div className="font-bold text-slate-850 dark:text-slate-200">
                          {pedido.cliente?.nome}
                        </div>
                        <div className="text-xs text-slate-400">{pedido.cliente?.responsavel}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={pedido.descricao}>
                        {pedido.descricao}
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-500 font-semibold uppercase">
                        <div>{pedido.tipoColeta === 'GRADE' ? 'Grade' : 'Nominal'}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          ({pedido.tipoProduto === 'CONJUNTO' ? 'Conjunto' : 
                            pedido.tipoProduto === 'APENAS_CALCA' ? 'Calça' :
                            pedido.tipoProduto === 'APENAS_SHORT' ? 'Short' :
                            pedido.tipoProduto === 'APENAS_BERMUDA' ? 'Bermuda' :
                            pedido.tipoProduto === 'APENAS_AGASALHO' ? 'Agasalho' : 'Camisa'})
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700 dark:text-slate-200">
                        {pedido.quantidadePrevista}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(pedido.status)}`}>
                          {getStatusText(pedido.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(pedido.token)}
                            className="h-8 rounded-lg text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                          >
                            {copiedToken === pedido.token ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                            )}
                            <span className="text-xs">Copiar Link</span>
                          </Button>
                          {pedido.cliente?.whatsapp && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendWhatsApp(pedido)}
                              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer" />
                            }
                          >
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <DropdownMenuItem
                              render={
                                <Link
                                  href={`/admin/pedidos/${pedido.id}`}
                                  className="cursor-pointer text-slate-700 dark:text-slate-300"
                                />
                              }
                            >
                              <Eye className="mr-2 h-3.5 w-3.5 text-slate-400" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(pedido)}
                              className="cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                            >
                              <Edit2 className="mr-2 h-3.5 w-3.5 text-slate-400" />
                              Editar pedido
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenDelete(pedido)}
                              className="cursor-pointer text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Excluir pedido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Pedido */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-850 dark:text-white">
              {editingPedido ? 'Editar Pedido' : 'Criar Novo Pedido'}
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400">
              Configure o formato de coleta e o tipo do produto.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="clienteId" className="text-slate-700 dark:text-slate-350">Cliente *</Label>
              {clientes.length === 0 ? (
                <div className="text-xs text-amber-500 py-1.5 px-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Nenhum cliente cadastrado. Cadastre um cliente antes.
                </div>
              ) : (
                <Select
                  value={selectedClienteId}
                  onValueChange={(val) => setValue('clienteId', val || '')}
                  disabled={isSubmitLoading || !!editingPedido}
                >
                  <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 focus:ring-indigo-550 bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                        {c.nome} ({c.responsavel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId.message as React.ReactNode}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-slate-700 dark:text-slate-350">Descrição do Lote/Pedido *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Uniforme Escolar 2026, Camisas de Futebol Fênix"
                className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-505"
                {...register('descricao')}
                disabled={isSubmitLoading}
              />
              {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message as React.ReactNode}</p>}
            </div>

            {/* Configuração de Coleta e Produto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoColeta" className="text-slate-700 dark:text-slate-350">Formato de Coleta *</Label>
                <Select
                  value={selectedTipoColeta}
                  onValueChange={(val) => setValue('tipoColeta', val as any)}
                  disabled={isSubmitLoading || !!editingPedido}
                >
                  <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <SelectItem value="NOMINAL" className="cursor-pointer">Lista Nominal</SelectItem>
                    <SelectItem value="GRADE" className="cursor-pointer">Grade Simplificada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoProduto" className="text-slate-700 dark:text-slate-350">Produto *</Label>
                <Select
                  value={selectedTipoProduto}
                  onValueChange={(val) => setValue('tipoProduto', val as any)}
                  disabled={isSubmitLoading || !!editingPedido}
                >
                  <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <SelectItem value="APENAS_CAMISA" className="cursor-pointer">Apenas Camisa</SelectItem>
                    <SelectItem value="CONJUNTO" className="cursor-pointer">Conjunto (Camisa + Short)</SelectItem>
                    <SelectItem value="APENAS_CALCA" className="cursor-pointer">Apenas Calça</SelectItem>
                    <SelectItem value="APENAS_SHORT" className="cursor-pointer">Apenas Short</SelectItem>
                    <SelectItem value="APENAS_BERMUDA" className="cursor-pointer">Apenas Bermuda</SelectItem>
                    <SelectItem value="APENAS_AGASALHO" className="cursor-pointer">Apenas Agasalho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidadePrevista" className="text-slate-700 dark:text-slate-350">Quantidade Prevista *</Label>
              <Input
                id="quantidadePrevista"
                type="number"
                min="1"
                placeholder="Ex: 50"
                className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-505"
                {...register('quantidadePrevista', { valueAsNumber: true })}
                disabled={isSubmitLoading}
              />
              {errors.quantidadePrevista && <p className="text-xs text-destructive">{errors.quantidadePrevista.message as React.ReactNode}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-slate-700 dark:text-slate-350">Observações</Label>
              <Input
                id="observacoes"
                placeholder="Ex: Tecido dry-fit premium, detalhes em silk."
                className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-505"
                {...register('observacoes')}
                disabled={isSubmitLoading}
              />
            </div>

            <DialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg cursor-pointer"
                disabled={isSubmitLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white font-medium cursor-pointer"
                disabled={isSubmitLoading || clientes.length === 0}
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Pedido'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Deleção */}
      <Dialog open={deletingPedido !== null} onOpenChange={(open) => !open && setDeletingPedido(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              Excluir Pedido
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400">
              Tem certeza que deseja excluir o pedido <strong>{deletingPedido?.numeroPedido}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Esta ação realizará o soft delete do pedido. Todos os dados preenchidos de participantes para este pedido também serão arquivados e o link de acesso público do cliente deixará de funcionar.
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingPedido(null)}
              className="rounded-lg cursor-pointer"
              disabled={isSubmitLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-lg bg-destructive hover:bg-destructive/90 text-white cursor-pointer"
              disabled={isSubmitLoading}
            >
              {isSubmitLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
