'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClienteSchema, ClienteInput, Cliente } from '@/features/clientes/types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  User,
  MoreHorizontal,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
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

export default function ClientesPage() {
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados dos Modais
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCliente, setEditingCliente] = React.useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = React.useState<Cliente | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClienteInput>({
    resolver: zodResolver(ClienteSchema),
    defaultValues: {
      nome: '',
      responsavel: '',
      telefone: '',
      whatsapp: '',
      email: '',
      observacoes: '',
    },
  });

  const loadClientes = async (search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes?q=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Erro ao carregar clientes');
      const data = await response.json();
      setClientes(data);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadClientes();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    loadClientes(e.target.value);
  };

  const handleOpenCreate = () => {
    reset({
      nome: '',
      responsavel: '',
      telefone: '',
      whatsapp: '',
      email: '',
      observacoes: '',
    });
    setEditingCliente(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setValue('nome', cliente.nome);
    setValue('responsavel', cliente.responsavel);
    setValue('telefone', cliente.telefone || '');
    setValue('whatsapp', cliente.whatsapp || '');
    setValue('email', cliente.email || '');
    setValue('observacoes', cliente.observacoes || '');
    setIsCreateOpen(true);
  };

  const handleOpenDelete = (cliente: Cliente) => {
    setDeletingCliente(cliente);
  };

  const onSubmit = async (data: ClienteInput) => {
    setIsSubmitLoading(true);
    setError(null);
    try {
      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes';
      const method = editingCliente ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Erro ao salvar cliente');
      }

      setIsCreateOpen(false);
      reset();
      setEditingCliente(null);
      loadClientes(searchTerm);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCliente) return;
    setIsSubmitLoading(true);
    try {
      const response = await fetch(`/api/clientes/${deletingCliente.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar cliente');
      
      setDeletingCliente(null);
      loadClientes(searchTerm);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Topo com ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Pesquisar clientes..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-visible:ring-indigo-500"
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/10 transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Cadastrar Cliente
        </Button>
      </div>

      {/* Lista de Clientes */}
      <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">Clientes Cadastrados</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Gerencie os contatos dos clientes da sua malharia.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
              <p className="text-sm text-slate-450 dark:text-slate-505">Carregando dados dos clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mb-2">
                <User className="h-6 w-6" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum cliente cadastrado</p>
              <p className="text-sm text-slate-400 max-w-xs">
                {searchTerm ? 'Nenhum resultado corresponde à pesquisa.' : 'Clique no botão acima para adicionar o primeiro cliente.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Nome / Empresa</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Responsável</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">WhatsApp</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">E-mail</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Cadastro</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {cliente.nome}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{cliente.responsavel}</TableCell>
                      <TableCell className="text-slate-650 dark:text-slate-300">
                        {cliente.whatsapp ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cliente.whatsapp}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-650 dark:text-slate-300">
                        {cliente.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cliente.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                        {formatDate(cliente.createdAt)}
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
                              onClick={() => handleOpenEdit(cliente)}
                              className="cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                            >
                              <Edit2 className="mr-2 h-3.5 w-3.5 text-slate-400" />
                              Editar cliente
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenDelete(cliente)}
                              className="cursor-pointer text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Excluir cliente
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

      {/* Modal Criar / Editar Cliente */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">
              {editingCliente ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400">
              Preencha os dados de contato do cliente. Os campos com asterisco são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="nome" className="text-slate-700 dark:text-slate-300">Nome do Cliente (Empresa/Organização) *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Escola Adventista, Time União FC"
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                  {...register('nome')}
                  disabled={isSubmitLoading}
                />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="responsavel" className="text-slate-700 dark:text-slate-300">Responsável (Pessoa Física) *</Label>
                <Input
                  id="responsavel"
                  placeholder="Ex: João da Silva"
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                  {...register('responsavel')}
                  disabled={isSubmitLoading}
                />
                {errors.responsavel && <p className="text-xs text-destructive">{errors.responsavel.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-slate-700 dark:text-slate-300">Telefone Fixo</Label>
                <Input
                  id="telefone"
                  placeholder="Ex: (11) 4002-8922"
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                  {...register('telefone')}
                  disabled={isSubmitLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-slate-700 dark:text-slate-300">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="Ex: (11) 99999-9999"
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                  {...register('whatsapp')}
                  disabled={isSubmitLoading}
                />
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: financeiro@empresa.com"
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                  {...register('email')}
                  disabled={isSubmitLoading}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="observacoes" className="text-slate-700 dark:text-slate-300">Observações Internas</Label>
                <Input
                  id="observacoes"
                  placeholder="Ex: Fazer preço diferenciado no boleto, etc."
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                  {...register('observacoes')}
                  disabled={isSubmitLoading}
                />
              </div>
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
                disabled={isSubmitLoading}
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Cliente'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Deleção */}
      <Dialog open={deletingCliente !== null} onOpenChange={(open) => !open && setDeletingCliente(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              Excluir Cliente
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400">
              Tem certeza que deseja excluir o cliente <strong>{deletingCliente?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Esta ação desativará o cliente do sistema e ele não aparecerá em novos pedidos. Pedidos antigos que já pertencem a este cliente permanecerão arquivados por segurança.
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingCliente(null)}
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
