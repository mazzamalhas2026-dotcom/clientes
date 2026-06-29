'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  FileSpreadsheet,
  Printer,
  Shirt,
  Scissors
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ParticipanteSchema, ParticipanteInput, Participante, TamanhosValidos, TamanhosShortsValidos, ResumoPedido } from '@/features/coleta/types';
import { Pedido, PedidoStatus } from '@/features/pedidos/types';

export default function PedidoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [pedido, setPedido] = React.useState<Pedido | null>(null);
  const [participantes, setParticipantes] = React.useState<Participante[]>([]);
  const [resumo, setResumo] = React.useState<ResumoPedido | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sizeFilter, setSizeFilter] = React.useState<string>('todos');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados dos Modais
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingPart, setEditingPart] = React.useState<Participante | null>(null);
  const [deletingPart, setDeletingPart] = React.useState<Participante | null>(null);

  // Estados específicos para Coleta por Grade no Admin
  const [gradeCamisas, setGradeCamisas] = React.useState<Record<string, number>>({} as any);
  const [gradeShorts, setGradeShorts] = React.useState<Record<string, number>>({} as any);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(ParticipanteSchema),
    defaultValues: {
      pedidoId: id as string,
      nomeCompleto: '',
      nomeCamisa: '',
      numero: '',
      tamanho: 'M',
      tamanhoShort: '',
      quantidadeCamisa: 1,
      quantidadeShort: 1,
      observacoes: '',
    },
  });

  const watchTamanho = watch('tamanho');
  const watchTamanhoShort = watch('tamanhoShort');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Carregar pedido completo (inclui participantes)
      const resPedido = await fetch(`/api/pedidos/${id}`);
      if (!resPedido.ok) throw new Error('Pedido não encontrado');
      const dataPedido = await resPedido.json();
      setPedido(dataPedido);
      setParticipantes(dataPedido.participantes || []);

      // Carregar resumo
      const resResumo = await fetch(`/api/coleta/${dataPedido.token}`);
      if (resResumo.ok) {
        const dataResumo = await resResumo.json();
        setResumo(dataResumo.resumo);

        if (dataPedido.tipoColeta === 'GRADE') {
          const initialCamisas = TamanhosValidos.reduce((acc, size) => {
            acc[size] = 0;
            return acc;
          }, {} as Record<string, number>);

          const initialShorts = TamanhosShortsValidos.reduce((acc, size) => {
            acc[size] = 0;
            return acc;
          }, {} as Record<string, number>);

          (dataPedido.participantes || []).forEach((p: any) => {
            if (p.tamanho) initialCamisas[p.tamanho]++;
            if (p.tamanhoShort) initialShorts[p.tamanhoShort]++;
          });

          setGradeCamisas(initialCamisas);
          setGradeShorts(initialShorts);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleOpenCreate = () => {
    reset({
      pedidoId: id as string,
      nomeCompleto: '',
      nomeCamisa: '',
      numero: '',
      tamanho: 'M',
      tamanhoShort: '',
      quantidadeCamisa: 1,
      quantidadeShort: 1,
      observacoes: '',
    });
    setEditingPart(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (part: Participante) => {
    setEditingPart(part);
    setValue('nomeCompleto', part.nomeCompleto || '');
    setValue('nomeCamisa', part.nomeCamisa || '');
    setValue('numero', part.numero || '');
    setValue('tamanho', part.tamanho || 'M');
    setValue('tamanhoShort', part.tamanhoShort || '');
    setValue('quantidadeCamisa', part.quantidadeCamisa ?? 1);
    setValue('quantidadeShort', part.quantidadeShort ?? 1);
    setValue('observacoes', part.observacoes || '');
    setIsCreateOpen(true);
  };

  const handleOpenDelete = (part: Participante) => {
    setDeletingPart(part);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitLoading(true);
    setError(null);
    try {
      const url = editingPart 
        ? `/api/pedidos/${id}/participantes/${editingPart.id}` 
        : `/api/pedidos/${id}/participantes`;
      const method = editingPart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          quantidadeCamisa: parseInt(data.quantidadeCamisa) || 0,
          quantidadeShort: parseInt(data.quantidadeShort) || 0,
          tamanhoShort: data.tamanhoShort || null,
        }),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Erro ao salvar participante');
      }

      setIsCreateOpen(false);
      reset();
      setEditingPart(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPart) return;
    setIsSubmitLoading(true);
    try {
      const response = await fetch(`/api/pedidos/${id}/participantes/${deletingPart.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar participante');
      
      setDeletingPart(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Salvar Grade pelo Admin
  const handleSaveGrade = async () => {
    if (!pedido) return;
    setIsSubmitLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/coleta/${pedido.token}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camisas: gradeCamisas, shorts: gradeShorts }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao salvar grade');
      }

      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Exportar Excel
  const handleExportExcel = () => {
    if (!pedido || participantes.length === 0) return;
    
    // --- Aba 1: Lista de Participantes ---
    const exportData = participantes.map((p) => ({
      'Nome Completo': p.nomeCompleto,
      'Nome Camisa': p.nomeCamisa,
      'Número': p.numero || '',
      'Tamanho Camisa': p.tamanho,
      'Qtd Camisa': p.quantidadeCamisa ?? 1,
      'Tamanho Short': p.tamanhoShort || '',
      'Qtd Short': p.tamanhoShort ? (p.quantidadeShort ?? 1) : 0,
      'Observações': p.observacoes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // --- Aba 2: Resumo por Tamanho ---
    const camisaCounts: Record<string, number> = {};
    const shortCounts: Record<string, number> = {};
    participantes.forEach((p) => {
      if (p.tamanho) camisaCounts[p.tamanho] = (camisaCounts[p.tamanho] || 0) + (p.quantidadeCamisa ?? 1);
      if (p.tamanhoShort) shortCounts[p.tamanhoShort] = (shortCounts[p.tamanhoShort] || 0) + (p.quantidadeShort ?? 1);
    });

    const allSizes = Array.from(new Set([...Object.keys(camisaCounts), ...Object.keys(shortCounts)]));
    const summaryData = allSizes.map((size) => ({
      'Tamanho': size,
      'Qtd Camisas': camisaCounts[size] || 0,
      'Qtd Shorts': shortCounts[size] || 0,
    }));

    const totalCamisas = Object.values(camisaCounts).reduce((a, b) => a + b, 0);
    const totalShorts = Object.values(shortCounts).reduce((a, b) => a + b, 0);

    summaryData.push({
      'Tamanho': 'TOTAL',
      'Qtd Camisas': totalCamisas,
      'Qtd Shorts': totalShorts,
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo por Tamanho');
    
    const filename = `${pedido.numeroPedido}_${pedido.cliente?.nome.replace(/\s+/g, '_')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    if (!pedido || participantes.length === 0) return;

    const isConj = pedido.tipoProduto === 'CONJUNTO';

    const headers = ['Nome Completo', 'Nome Camisa', 'Número', 'Tamanho Camisa', 'Qtd Camisa'];
    if (isConj) {
      headers.push('Tamanho Short', 'Qtd Short');
    }
    headers.push('Observações');

    const rows = participantes.map((p) => {
      const cols = [
        p.nomeCompleto,
        p.nomeCamisa,
        p.numero || '',
        p.tamanho,
        (p.quantidadeCamisa ?? 1).toString(),
      ];
      if (isConj) {
        cols.push(p.tamanhoShort || '', p.tamanhoShort ? (p.quantidadeShort ?? 1).toString() : '0');
      }
      cols.push(p.observacoes || '');
      return cols;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const filename = `${pedido.numeroPedido}_${pedido.cliente?.nome.replace(/\s+/g, '_')}.csv`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir Checklist de Conferência
  const handlePrintChecklist = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
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

  // Filtrar participantes (Nominal)
  const filteredParticipantes = participantes.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.nomeCompleto.toLowerCase().includes(term) ||
      p.nomeCamisa.toLowerCase().includes(term) ||
      (p.numero && p.numero.includes(term)) ||
      (p.observacoes && p.observacoes.toLowerCase().includes(term));
      
    const matchesSize = sizeFilter === 'todos' || p.tamanho === sizeFilter || p.tamanhoShort === sizeFilter;
    
    return matchesSearch && matchesSize;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
        <p className="text-sm text-slate-450">Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="font-semibold text-slate-855 dark:text-slate-200">Pedido não encontrado</p>
        <Link href="/admin/pedidos">
          <Button className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-755">
            Voltar para Pedidos
          </Button>
        </Link>
      </div>
    );
  }

  const isConj = pedido.tipoProduto === 'CONJUNTO';
  const isGrade = pedido.tipoColeta === 'GRADE';

  return (
    <div className="space-y-6">
      
      {/* -------------------- INÍCIO DA ÁREA DE IMPRESSÃO (CHECKLIST FISICO) -------------------- */}
      <div className="hidden print:block font-sans p-6 text-black bg-white space-y-6">
        <div className="flex justify-between items-start border-b border-black pb-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">CHECKLIST DE CONFERÊNCIA DE PRODUÇÃO</h1>
            <p className="text-sm font-bold mt-1">Lote: <span className="underline">{pedido.numeroPedido}</span></p>
            <p className="text-xs text-gray-600">Descrição: {pedido.descricao}</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold">Cliente: {pedido.cliente?.nome}</h2>
            <p className="text-xs text-gray-500">Responsável: {pedido.cliente?.responsavel}</p>
            <p className="text-xs text-gray-500">Impresso em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        <div className="flex gap-4 text-xs font-bold bg-gray-150 p-3 border border-black rounded-lg flex-wrap">
          <div>Total de Peças: {participantes.length} unid.</div>
          <div>•</div>
          <div>Grade: {isGrade ? 'Simplificada (Sem Nomes)' : 'Lista Nominal'}</div>
          <div>•</div>
          <div>Modelo: {isConj ? 'Conjunto (Camisa + Short)' : 'Apenas Camisa'}</div>
        </div>

        {/* Resumo de tamanhos - sempre visível no checklist */}
        {!isGrade && (() => {
          const camisaCounts: Record<string, number> = {};
          const shortCounts: Record<string, number> = {};
          participantes.forEach((p) => {
            if (p.tamanho) camisaCounts[p.tamanho] = (camisaCounts[p.tamanho] || 0) + 1;
            if (p.tamanhoShort) shortCounts[p.tamanhoShort] = (shortCounts[p.tamanhoShort] || 0) + 1;
          });
          const hasShortsData = Object.keys(shortCounts).length > 0;
          return (
            <div className={`grid gap-6 mt-2 ${hasShortsData ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <h3 className="font-extrabold text-xs mb-2 border-b border-black pb-1">RESUMO POR TAMANHO — CAMISAS</h3>
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1 text-left">Tamanho</th>
                      <th className="border border-black p-1 text-center w-14">Qtd</th>
                      <th className="border border-black p-1 text-center w-16">[ ] OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(camisaCounts).map(([size, qty]) => (
                      <tr key={`sumcam-${size}`}>
                        <td className="border border-black p-1 font-bold uppercase">{size}</td>
                        <td className="border border-black p-1 text-center font-black text-sm">{qty}</td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-black">
                      <td className="border border-black p-1">TOTAL</td>
                      <td className="border border-black p-1 text-center">{participantes.length}</td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {hasShortsData && (
                <div>
                  <h3 className="font-extrabold text-xs mb-2 border-b border-black pb-1">RESUMO POR TAMANHO — SHORTS</h3>
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-left">Tamanho</th>
                        <th className="border border-black p-1 text-center w-14">Qtd</th>
                        <th className="border border-black p-1 text-center w-16">[ ] OK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(shortCounts).map(([size, qty]) => (
                        <tr key={`sumshort-${size}`}>
                          <td className="border border-black p-1 font-bold uppercase">{size}</td>
                          <td className="border border-black p-1 text-center font-black text-sm">{qty}</td>
                          <td className="border border-black p-1"></td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-black">
                        <td className="border border-black p-1">TOTAL</td>
                        <td className="border border-black p-1 text-center">{Object.values(shortCounts).reduce((a,b)=>a+b,0)}</td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* Se for Coleta por Grade */}
        {isGrade ? (
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div>
              <h3 className="font-extrabold text-sm mb-3 border-b border-black pb-1">GRADE DE CAMISAS</h3>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1.5 text-left">Tamanho</th>
                    <th className="border border-black p-1.5 text-center w-16">Qtd</th>
                    <th className="border border-black p-1.5 text-center w-28">[ ] Cortado</th>
                    <th className="border border-black p-1.5 text-center w-28">[ ] OK / Conferido</th>
                  </tr>
                </thead>
                <tbody>
                  {TamanhosValidos.map((size) => {
                    const qty = resumo?.totalPorTamanho.find((t) => t.tamanho === size)?.quantidade || 0;
                    if (qty === 0) return null;
                    return (
                      <tr key={`print-camisa-${size}`}>
                        <td className="border border-black p-1.5 font-bold uppercase">{size}</td>
                        <td className="border border-black p-1.5 text-center font-bold text-sm">{qty}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isConj && (
              <div>
                <h3 className="font-extrabold text-sm mb-3 border-b border-black pb-1">GRADE DE SHORTS</h3>
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1.5 text-left">Tamanho</th>
                      <th className="border border-black p-1.5 text-center w-16">Qtd</th>
                      <th className="border border-black p-1.5 text-center w-28">[ ] Cortado</th>
                      <th className="border border-black p-1.5 text-center w-28">[ ] OK / Conferido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TamanhosShortsValidos.map((size) => {
                      const qty = resumo?.totalPorTamanhoShort?.find((t) => t.tamanho === size)?.quantidade || 0;
                      if (qty === 0) return null;
                      return (
                        <tr key={`print-short-${size}`}>
                          <td className="border border-black p-1.5 font-bold uppercase">{size}</td>
                          <td className="border border-black p-1.5 text-center font-bold text-sm">{qty}</td>
                          <td className="border border-black p-1.5"></td>
                          <td className="border border-black p-1.5"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Se for Coleta Nominal */
          <table className="w-full border-collapse border border-black text-[10px] mt-4">
            <thead>
              <tr className="bg-gray-150 font-bold">
                <th className="border border-black p-1 text-center w-6">#</th>
                <th className="border border-black p-1 text-left">Nome Completo</th>
                <th className="border border-black p-1 text-left">Nome Estampado</th>
                <th className="border border-black p-1 text-center w-10">Nº</th>
                <th className="border border-black p-1 text-center w-14">Camisa</th>
                <th className="border border-black p-1 text-center w-14">Short</th>
                <th className="border border-black p-1 text-left">Observações</th>
                <th className="border border-black p-1 text-center w-12">Costura</th>
                <th className="border border-black p-1 text-center w-12">Silk/Subl.</th>
                <th className="border border-black p-1 text-center w-12">Conferido</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((p, index) => (
                <tr key={`print-part-${p.id}`} className="hover:bg-gray-50">
                  <td className="border border-black p-1 text-center font-mono">{index + 1}</td>
                  <td className="border border-black p-1 font-bold truncate max-w-[150px]">{p.nomeCompleto}</td>
                  <td className="border border-black p-1 font-semibold truncate max-w-[100px]">{p.nomeCamisa}</td>
                  <td className="border border-black p-1 text-center font-bold">{p.numero || '-'}</td>
                  <td className="border border-black p-1 text-center font-extrabold uppercase">
                    {p.tamanho} {p.quantidadeCamisa > 1 ? `(x${p.quantidadeCamisa})` : ''}
                  </td>
                  <td className="border border-black p-1 text-center font-extrabold uppercase">
                    {p.tamanhoShort ? `${p.tamanhoShort} ${p.quantidadeShort > 1 ? `(x${p.quantidadeShort})` : ''}` : '-'}
                  </td>
                  <td className="border border-black p-1 text-[9px] truncate max-w-[150px]">{p.observacoes || '-'}</td>
                  <td className="border border-black p-1 text-center">[ ]</td>
                  <td className="border border-black p-1 text-center">[ ]</td>
                  <td className="border border-black p-1 text-center">[ ]</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="pt-20 flex justify-between items-center text-xs border-t border-gray-200 mt-20">
          <div className="text-center w-48">
            <div className="border-b border-black w-full mb-1"></div>
            Assinatura - Conferência Costura
          </div>
          <div className="text-center w-48">
            <div className="border-b border-black w-full mb-1"></div>
            Assinatura - Expedição e Entrega
          </div>
        </div>
      </div>
      {/* -------------------- FIM DA ÁREA DE IMPRESSÃO -------------------- */}

      {/* -------------------- INÍCIO DA ÁREA WEB (SCREEN) -------------------- */}
      <div className="space-y-6 print:hidden">
        
        {/* Header com Informações e Ações */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <Link href="/admin/pedidos" className="inline-flex items-center text-xs text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 gap-1 hover:underline mb-2">
                <ArrowLeft className="h-3 w-3" /> Voltar para Pedidos
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {pedido.numeroPedido}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(pedido.status)}`}>
                  {getStatusText(pedido.status)}
                </span>
              </div>
              <p className="text-slate-650 dark:text-slate-300 font-semibold text-sm">
                Cliente: <span className="text-indigo-600 dark:text-indigo-400">{pedido.cliente?.nome}</span> ({pedido.cliente?.responsavel})
              </p>
              <p className="text-xs text-slate-450 dark:text-slate-505 flex items-center gap-1.5 mt-1">
                <Calendar className="h-3 w-3" /> Cadastrado em {new Date(pedido.createdAt).toLocaleDateString('pt-BR')} • {isGrade ? 'Grade de Tamanhos' : 'Lista Nominal'} • {isConj ? 'Conjunto' : 'Apenas Camisa'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              {/* Botão Checklist Físico */}
              <Button
                onClick={handlePrintChecklist}
                variant="outline"
                className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-300 cursor-pointer flex-1 sm:flex-none font-bold"
              >
                <Printer className="mr-2 h-4 w-4 text-indigo-500" /> Imprimir Checklist
              </Button>

              {participantes.length > 0 && !isGrade && (
                <>
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-300 cursor-pointer flex-1 sm:flex-none"
                  >
                    <Download className="mr-2 h-4 w-4 text-emerald-500" /> Exportar Excel
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-300 cursor-pointer flex-1 sm:flex-none"
                  >
                    <Download className="mr-2 h-4 w-4 text-sky-500" /> Exportar CSV
                  </Button>
                </>
              )}
              
              {!isGrade && (
                <Button
                  onClick={handleOpenCreate}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Linha
                </Button>
              )}
            </div>
          </div>

          {/* Alerta de Auditoria se Finalizado */}
          {pedido.status === PedidoStatus.FINALIZADO && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-450 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <span className="font-bold animate-pulse">Coleta Finalizada!</span> Este pedido foi concluído e travado pelo cliente. 
                Como administrador, você ainda pode realizar alterações corretivas na tabela abaixo.
              </div>
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card Quantidades */}
            <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm rounded-2xl overflow-hidden transition-colors duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-405 dark:text-slate-450 uppercase tracking-wider">Quantidade Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl font-black text-slate-800 dark:text-white">
                    {participantes.length}
                  </span>
                  <span className="text-xs text-slate-400">
                    de {pedido.quantidadePrevista} previstas
                  </span>
                </div>
                
                {/* Barra de Progresso */}
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      participantes.length >= pedido.quantidadePrevista
                        ? 'bg-emerald-500'
                        : 'bg-indigo-650'
                    }`}
                    style={{
                      width: `${Math.min(100, (participantes.length / pedido.quantidadePrevista) * 100)}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card Resumo de Camisas */}
            <Card className="md:col-span-2 border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm rounded-2xl overflow-hidden transition-colors duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-450 dark:text-slate-450 uppercase tracking-wider">
                  {isConj ? 'Camisas por Tamanho' : 'Tamanhos Consolidados'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resumo && resumo.totalPorTamanho.some(t => t.quantidade > 0) ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-36 overflow-y-auto">
                    {resumo.totalPorTamanho.map((t) => (
                      <div
                        key={t.tamanho}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          t.quantidade > 0
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-extrabold scale-[1.02]'
                            : 'bg-slate-50/30 dark:bg-slate-900/20 border-slate-100 dark:border-slate-900 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold tracking-wider mb-1 truncate w-full text-center">{t.tamanho}</span>
                        <span className="text-base">{t.quantidade}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm py-4 flex items-center gap-1.5 justify-center">
                    <Info className="h-4 w-4" /> Nenhum participante adicionado para exibir o resumo.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Card Resumo de Shorts se Conjunto */}
          {isConj && resumo?.totalPorTamanhoShort && (
            <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm rounded-2xl overflow-hidden transition-colors duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-405 uppercase tracking-wider">Shorts por Tamanho</CardTitle>
              </CardHeader>
              <CardContent>
                {resumo.totalPorTamanhoShort.some(t => t.quantidade > 0) ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-36 overflow-y-auto">
                    {resumo.totalPorTamanhoShort.map((t) => (
                      <div
                        key={`summary-short-${t.tamanho}`}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          t.quantidade > 0
                            ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-900/50 text-sky-700 dark:text-sky-400 font-extrabold scale-[1.02]'
                            : 'bg-slate-50/30 dark:bg-slate-900/20 border-slate-100 dark:border-slate-900 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold tracking-wider mb-1 truncate w-full text-center">{t.tamanho}</span>
                        <span className="text-base">{t.quantidade}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-450 text-sm py-4 flex items-center gap-1.5 justify-center">
                    <Info className="h-4 w-4" /> Nenhum short adicionado ainda.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* VISTA 1: Pedido por Grade Simplificado */}
        {isGrade ? (
          <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-indigo-500" />
                  Grade de Produção
                </CardTitle>
                <CardDescription className="text-slate-450">
                  Edite e controle as quantidades totais para a confecção.
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveGrade}
                disabled={isSubmitLoading}
                className="w-full sm:w-auto rounded-xl bg-indigo-650 hover:bg-indigo-705 text-white font-medium cursor-pointer"
              >
                {isSubmitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              
              {error && (
                <div className="p-3 mb-4 rounded-lg bg-destructive/15 text-destructive border border-destructive/20 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Camisas Grid */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-indigo-600 uppercase tracking-wider border-b pb-2">Camisas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {TamanhosValidos.map((size) => (
                      <div key={`edit-camisa-${size}`} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                        <span className="font-bold text-slate-700 dark:text-slate-350">{size}</span>
                        <Input
                          type="number"
                          min="0"
                          value={gradeCamisas[size] || 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setGradeCamisas(prev => ({ ...prev, [size]: val }));
                          }}
                          className="h-8 w-16 text-center font-bold rounded-lg border-slate-200 dark:border-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shorts Grid if Conjunto */}
                {isConj ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-sky-505 uppercase tracking-wider border-b pb-2">Shorts</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {TamanhosShortsValidos.map((size) => (
                        <div key={`edit-short-${size}`} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                          <span className="font-bold text-slate-700 dark:text-slate-350">{size}</span>
                          <Input
                            type="number"
                            min="0"
                            value={gradeShorts[size] || 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setGradeShorts(prev => ({ ...prev, [size]: val }));
                            }}
                            className="h-8 w-16 text-center font-bold rounded-lg border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 bg-indigo-50/10 dark:bg-indigo-950/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                    Grade de shorts desativada para este lote.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* VISTA 2: Tabela de Participantes Nominal */
          <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Planilha Nominal</CardTitle>
                  <CardDescription className="text-slate-450 dark:text-slate-455">
                    Lista de pessoas, nomes estampados e tamanhos preenchidos.
                  </CardDescription>
                </div>
                
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:max-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Filtrar por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 rounded-lg text-xs border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                    />
                  </div>

                  <Select value={sizeFilter} onValueChange={(val) => setSizeFilter(val || 'todos')}>
                    <SelectTrigger className="h-8 rounded-lg text-xs w-full sm:w-[130px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <SelectValue placeholder="Tamanho" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <SelectItem value="todos" className="text-xs cursor-pointer">Todos os Tamanhos</SelectItem>
                      {TamanhosValidos.map((size) => (
                        <SelectItem key={`filter-${size}`} value={size} className="text-xs cursor-pointer">
                          Tamanho {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              
              {error && (
                <div className="p-3 mb-4 mx-4 sm:mx-0 rounded-lg bg-destructive/15 text-destructive border border-destructive/20 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {filteredParticipantes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mb-1">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-350 text-sm">Nenhuma linha encontrada</p>
                  <p className="text-xs text-slate-450 max-w-xs">
                    {searchTerm || sizeFilter !== 'todos' 
                      ? 'Limpe os filtros de pesquisa para visualizar.' 
                      : 'Nenhum participante adicionado a este pedido ainda.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs w-10 text-center">#</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs">Nome Completo</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs">Nome na Camisa</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs text-center">Número</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs text-center">Camisa</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs text-center w-16">Qtd</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs text-center">Short</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs text-center w-16">Qtd</TableHead>
                        <TableHead className="font-semibold text-slate-755 dark:text-slate-350 text-xs">Observações</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipantes.map((part, index) => (
                        <TableRow key={part.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <TableCell className="text-center text-xs text-slate-400 font-mono">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {part.nomeCompleto || <span className="text-slate-300 italic">Sem nome</span>}
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300 text-sm font-semibold tracking-wide">
                            {part.nomeCamisa || <span className="text-slate-300 italic">Sem estampa</span>}
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {part.numero || <span className="text-slate-350 font-normal">-</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 text-xs font-extrabold rounded-md min-w-[32px] uppercase">
                              {part.tamanho}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {part.quantidadeCamisa}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block px-2 py-0.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 text-xs font-extrabold rounded-md min-w-[32px] uppercase">
                              {part.tamanhoShort || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {part.tamanhoShort ? part.quantidadeShort : '-'}
                          </TableCell>
                          <TableCell className="text-slate-550 dark:text-slate-400 text-xs max-w-[200px] truncate" title={part.observacoes || ''}>
                            {part.observacoes || <span className="text-slate-300 dark:text-slate-800">-</span>}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer animate-pulse" />
                                }
                              >
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(part)}
                                  className="cursor-pointer text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
                                >
                                  <Edit2 className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                  Editar linha
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenDelete(part)}
                                  className="cursor-pointer text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Excluir linha
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
        )}
      </div>
      {/* -------------------- FIM DA ÁREA WEB (SCREEN) -------------------- */}

      {/* Modal Criar / Editar Linha de Participante */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl print:hidden">
          <DialogHeader>
            <DialogTitle className="text-slate-850 dark:text-white">
              {editingPart ? 'Editar Linha' : 'Adicionar Linha'}
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400">
              Insira os dados do participante do pedido de malha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto" className="text-slate-700 dark:text-slate-350">Nome Completo</Label>
              <Input
                id="nomeCompleto"
                placeholder="Ex: João da Silva Santos"
                className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                {...register('nomeCompleto')}
                disabled={isSubmitLoading}
              />
              {errors.nomeCompleto && <p className="text-xs text-destructive">{errors.nomeCompleto.message as React.ReactNode}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeCamisa" className="text-slate-700 dark:text-slate-350">Nome na Camisa</Label>
              <Input
                id="nomeCamisa"
                placeholder="Ex: JOÃO SILVA"
                className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                {...register('nomeCamisa')}
                disabled={isSubmitLoading}
              />
              {errors.nomeCamisa && <p className="text-xs text-destructive">{errors.nomeCamisa.message as React.ReactNode}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero" className="text-slate-700 dark:text-slate-350">Número</Label>
                <Input
                  id="numero"
                  placeholder="Ex: 10"
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 text-center font-bold"
                  {...register('numero')}
                  disabled={isSubmitLoading}
                />
                {errors.numero && <p className="text-xs text-destructive">{errors.numero.message as React.ReactNode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tamanho" className="text-slate-700 dark:text-slate-350">Camisa *</Label>
                <Select
                  value={watchTamanho || 'M'}
                  onValueChange={(val) => setValue('tamanho', val as any)}
                  disabled={isSubmitLoading}
                >
                  <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 focus:ring-indigo-500 bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg max-h-56 overflow-y-auto">
                    {TamanhosValidos.map((size) => (
                      <SelectItem key={size} value={size} className="cursor-pointer">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tamanho && <p className="text-xs text-destructive">{errors.tamanho.message as React.ReactNode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidadeCamisa" className="text-slate-700 dark:text-slate-350">Qtd Camisa</Label>
                <Input
                  id="quantidadeCamisa"
                  type="number"
                  min="0"
                  className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 text-center font-bold"
                  {...register('quantidadeCamisa', { valueAsNumber: true })}
                  disabled={isSubmitLoading}
                />
              </div>
              {isConj ? (
                <div className="space-y-2">
                  <Label htmlFor="quantidadeShort" className="text-slate-700 dark:text-slate-350">Qtd Short</Label>
                  <Input
                    id="quantidadeShort"
                    type="number"
                    min="0"
                    className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 text-center font-bold"
                    {...register('quantidadeShort', { valueAsNumber: true })}
                    disabled={isSubmitLoading}
                  />
                </div>
              ) : (
                <div />
              )}
            </div>

            {isConj && (
              <div className="space-y-2">
                <Label htmlFor="tamanhoShort" className="text-slate-700 dark:text-slate-350">Tamanho do Short</Label>
                <Select
                  value={watchTamanhoShort || ''}
                  onValueChange={(val) => setValue('tamanhoShort', val as any)}
                  disabled={isSubmitLoading}
                >
                  <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 focus:ring-indigo-500 bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg max-h-56 overflow-y-auto">
                    {TamanhosShortsValidos.map((size) => (
                      <SelectItem key={`modal-short-${size}`} value={size} className="cursor-pointer">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tamanhoShort && <p className="text-xs text-destructive">{errors.tamanhoShort.message as React.ReactNode}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-slate-700 dark:text-slate-350">Observações</Label>
              <Input
                id="observacoes"
                placeholder="Ex: Manga curta normal, punho elástico."
                className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
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
                disabled={isSubmitLoading}
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Linha'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Deleção de Participante */}
      <Dialog open={deletingPart !== null} onOpenChange={(open) => !open && setDeletingPart(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl print:hidden">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              Excluir Participante
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400">
              Tem certeza que deseja excluir <strong>{deletingPart?.nomeCompleto || 'esta linha'}</strong> da lista?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-sm text-slate-500 dark:text-slate-400">
            Esta linha será removida da lista deste pedido permanentemente (suavemente excluída).
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingPart(null)}
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
