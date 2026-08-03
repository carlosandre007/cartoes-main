import React from 'react';
import {
  FileCheck2,
  Plus,
  Building,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const CreditPortfolioView: React.FC = () => {
  const { contracts, openPayContractModal, openNewTransactionModal, addContract, updateContract, deleteContract } = useFinancial();
  const [isAddContractOpen, setIsAddContractOpen] = React.useState(false);
  const [newContractForm, setNewContractForm] = React.useState({
    titulo: '',
    tipo: 'FINANCIAMENTO' as const,
    instituicao: '',
    valorTotal: '100000',
    parcelasTotal: 24,
    valorParcelaMensal: '4500',
    taxaJurosAnual: '9.5',
    categoria: 'Financiamento Imobiliário',
  });

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractForm.titulo.trim()) {
      alert('Informe o título do contrato.');
      return;
    }
    const valTotal = parseFloat(newContractForm.valorTotal) || 0;
    const pTotal = newContractForm.parcelasTotal || 1;
    addContract({
      titulo: newContractForm.titulo,
      tipo: newContractForm.tipo,
      instituicao: newContractForm.instituicao || 'Aureum Credit',
      valorTotal: valTotal,
      valorPago: 0,
      valorRestante: valTotal,
      parcelasTotal: pTotal,
      parcelasPagas: 0,
      valorParcelaMensal: parseFloat(newContractForm.valorParcelaMensal) || valTotal / pTotal,
      taxaJurosAnual: parseFloat(newContractForm.taxaJurosAnual) || 0,
      proximoVencimento: new Date().toISOString().split('T')[0],
      categoria: newContractForm.categoria,
      status: 'EM_DIA',
    });
    setIsAddContractOpen(false);
    setNewContractForm({
      titulo: '',
      tipo: 'FINANCIAMENTO',
      instituicao: '',
      valorTotal: '100000',
      parcelasTotal: 24,
      valorParcelaMensal: '4500',
      taxaJurosAnual: '9.5',
      categoria: 'Financiamento Imobiliário',
    });
  };

  const handleEditContract = (contractId: string) => {
    const contract = contracts.find((item) => item.id === contractId);
    if (!contract) return;
    const titulo = prompt('Título do contrato:', contract.titulo)?.trim();
    if (!titulo) return;
    const taxa = Number(prompt('Taxa anual (%):', String(contract.taxaJurosAnual))?.replace(',', '.'));
    if (!Number.isFinite(taxa) || taxa < 0) return;
    updateContract(contractId, { titulo, taxaJurosAnual: taxa });
  };

  const totalEmprestado = contracts.reduce((acc, c) => acc + c.valorTotal, 0);
  const totalPago = contracts.reduce((acc, c) => acc + c.valorPago, 0);
  const totalRestante = contracts.reduce((acc, c) => acc + c.valorRestante, 0);
  const pctGeral = Math.round((totalPago / (totalEmprestado || 1)) * 100);

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              AUREUM CREDIT PORTFOLIO • CARNÊS & FINANCIAMENTOS
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Carteira de Crédito & Carnês</h2>
          <p className="text-xs text-zinc-400">
            Gestão estruturada de financiamentos imobiliários, veículos, empréstimos e carnês parcelados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddContractOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-400 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Contrato</span>
          </button>

          <button
            onClick={() =>
              openNewTransactionModal({
                origemFinanceira: 'CARNE',
                tipo: 'DESPESA',
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Lançar no Fluxo Central</span>
          </button>
        </div>
      </div>

      {/* Modal Cadastrar Contrato de Crédito */}
      {isAddContractOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-amber-500/30 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" /> Cadastrar Novo Contrato
            </h3>
            <form onSubmit={handleCreateContract} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Título do Contrato</label>
                <input
                  type="text"
                  placeholder="Ex: Financiamento Imóvel Jardins"
                  value={newContractForm.titulo}
                  onChange={(e) => setNewContractForm({ ...newContractForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                  <select
                    value={newContractForm.tipo}
                    onChange={(e) => setNewContractForm({ ...newContractForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  >
                    <option value="FINANCIAMENTO">Financiamento</option>
                    <option value="EMPRESTIMO">Empréstimo</option>
                    <option value="CARNE">Carnê Parcelado</option>
                    <option value="CONSORCIO">Consórcio</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Instituição</label>
                  <input
                    type="text"
                    placeholder="Ex: Itaú BBA"
                    value={newContractForm.instituicao}
                    onChange={(e) => setNewContractForm({ ...newContractForm, instituicao: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 500000"
                    value={newContractForm.valorTotal}
                    onChange={(e) => setNewContractForm({ ...newContractForm, valorTotal: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Total de Parcelas</label>
                  <input
                    type="number"
                    value={newContractForm.parcelasTotal}
                    onChange={(e) => setNewContractForm({ ...newContractForm, parcelasTotal: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddContractOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Total de Contratos</span>
          <div className="text-xl font-black font-mono text-zinc-100">
            R$ {totalEmprestado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">{contracts.length} contratos ativos</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Valor Já Amortizado</span>
          <div className="text-xl font-black font-mono text-emerald-400">
            R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-500 font-mono">{pctGeral}% quitado</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-red-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Saldo Devedor Restante</span>
          <div className="text-xl font-black font-mono text-red-400">
            R$ {totalRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Próxima parcela este mês</span>
        </div>
      </div>

      {/* Contracts Portfolio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contracts.map((contract) => {
          const pct = Math.round((contract.valorPago / contract.valorTotal) * 100);

          return (
            <div
              key={contract.id}
              className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-xl space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/20 uppercase">
                    {contract.tipo}
                  </span>
                  <h3 className="text-base font-bold text-zinc-100 font-sans mt-2">
                    {contract.titulo}
                  </h3>
                  <p className="text-xs text-zinc-400">{contract.instituicao}</p>
                </div>

                <div className="text-right font-mono">
                  <div className="flex justify-end gap-2 mb-1">
                    <button onClick={() => handleEditContract(contract.id)} className="text-zinc-500 hover:text-amber-400" title="Editar contrato"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => confirm('Excluir este contrato? Os lançamentos vinculados serão preservados.') && deleteContract(contract.id)} className="text-zinc-500 hover:text-red-400" title="Excluir contrato"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="text-[10px] text-zinc-400 block">Taxa de Juros</span>
                  <span className="text-amber-400 font-bold text-sm">{contract.taxaJurosAnual}% a.a.</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">
                    Parcelas: {contract.parcelasPagas} de {contract.parcelasTotal} pagas
                  </span>
                  <span className="text-amber-400 font-bold">{pct}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  />
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-sans">Valor Pago</span>
                  <span className="text-emerald-400 font-bold">
                    R$ {contract.valorPago.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-sans">Saldo Devedor</span>
                  <span className="text-amber-400 font-bold">
                    R$ {contract.valorRestante.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Pay Action */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <div className="text-xs">
                  <span className="text-zinc-400 block text-[10px]">Parcela Mensal:</span>
                  <span className="font-bold font-mono text-zinc-100">
                    R$ {contract.valorParcelaMensal.toLocaleString('pt-BR')}
                  </span>
                </div>

                <button
                  onClick={() => openPayContractModal(contract)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Pagar Parcela (PIX)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
