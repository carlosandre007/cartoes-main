import React, { useState } from 'react';
import {
  Building2,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  CheckCircle,
  Landmark,
  Edit2,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const BankAccountsView: React.FC = () => {
  const { bankAccounts, transactions, openNewTransactionModal, addBankAccount, updateBankAccount, deleteBankAccount, toggleTransactionStatus, deleteContractWithTransactions } = useFinancial();
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');
  const [newBankForm, setNewBankForm] = useState({
    banco: '',
    agencia: '0001',
    conta: '',
    tipo: 'CORRENTE' as const,
    saldo: '0',
    logoColor: '#fbbf24',
    ativa: true,
  });

  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankForm.banco.trim()) {
      alert('Informe o nome do banco.');
      return;
    }
    const createdId = addBankAccount({
      banco: newBankForm.banco,
      agencia: newBankForm.agencia || '0001',
      conta: newBankForm.conta || `${Math.floor(10000 + Math.random() * 90000)}-0`,
      tipo: newBankForm.tipo,
      saldo: parseFloat(newBankForm.saldo) || 0,
      logoColor: newBankForm.logoColor,
      ativa: true,
    });
    setSelectedBankId(createdId);
    setIsAddBankOpen(false);
    setNewBankForm({
      banco: '',
      agencia: '0001',
      conta: '',
      tipo: 'CORRENTE',
      saldo: '0',
      logoColor: '#fbbf24',
      ativa: true,
    });
  };

  const handleEditBank = (bankId: string) => {
    const bank = bankAccounts.find((item) => item.id === bankId);
    if (!bank) return;
    const banco = prompt('Nome do banco:', bank.banco)?.trim();
    if (!banco) return;
    const saldo = Number(prompt('Saldo atual (R$):', String(bank.saldo))?.replace(',', '.'));
    if (!Number.isFinite(saldo)) return;
    updateBankAccount(bankId, { banco, saldo });
  };

  const handleDeleteLinkedContract = async (contractId: string, description: string) => {
    if (!confirm(`Excluir o contrato de "${description}" e TODAS as parcelas vinculadas? Use esta opção para refazer o financiamento do zero.`)) return;
    const deleted = await deleteContractWithTransactions(contractId);
    if (!deleted) alert('Não foi possível excluir o contrato completo no banco de dados.');
  };

  const totalConsolidado = bankAccounts.reduce((acc, b) => acc + b.saldo, 0);
  const selectedAccount = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];

  // Bank transactions
  const bankTxs = transactions
    .filter((tx) => tx.contaBancariaId === selectedAccount?.id && (!monthFilter || tx.data.startsWith(monthFilter)))
    .sort((a, b) => a.data.localeCompare(b.data));
  const monthKeyFromOffset = (offset: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              AUREUM OPEN FINANCE • MULTI-BANKING
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Contas Bancárias & Saldos</h2>
          <p className="text-xs text-zinc-400">
            Consolidação em tempo real de contas correntes, investimentos e reservas de oportunidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddBankOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-400 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Conta</span>
          </button>

          <button
            onClick={() =>
              openNewTransactionModal({
                origemFinanceira: 'CONTA_BANCARIA',
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Movimento Bancário</span>
          </button>
        </div>
      </div>

      {/* Modal Cadastrar Conta Bancária */}
      {isAddBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-amber-500/30 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" /> Cadastrar Nova Conta Bancária
            </h3>
            <form onSubmit={handleCreateBank} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome do Banco</label>
                <input
                  type="text"
                  placeholder="Ex: BTG Pactual / XP Private"
                  value={newBankForm.banco}
                  onChange={(e) => setNewBankForm({ ...newBankForm, banco: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Agência</label>
                  <input
                    type="text"
                    placeholder="Ex: 0001"
                    value={newBankForm.agencia}
                    onChange={(e) => setNewBankForm({ ...newBankForm, agencia: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Conta Corrente</label>
                  <input
                    type="text"
                    placeholder="Ex: 12345-6"
                    value={newBankForm.conta}
                    onChange={(e) => setNewBankForm({ ...newBankForm, conta: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tipo de Conta</label>
                  <select
                    value={newBankForm.tipo}
                    onChange={(e) => setNewBankForm({ ...newBankForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  >
                    <option value="CORRENTE">Conta Corrente</option>
                    <option value="POUPANCA">Poupança</option>
                    <option value="INVESTIMENTO">Conta Investimentos</option>
                    <option value="PAYROLL">Conta Pagamentos</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Saldo Inicial (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 50000"
                    value={newBankForm.saldo}
                    onChange={(e) => setNewBankForm({ ...newBankForm, saldo: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBankOpen(false)}
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

      {/* Total Consolidated Banner */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs font-medium text-zinc-400 block">
            Saldo Consolidado Global (Todas as Contas)
          </span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            R$ {totalConsolidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" /> Dados atualizados
        </div>
      </div>

      {/* Bank Accounts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bankAccounts.map((acc) => {
          const isSelected = acc.id === selectedBankId;

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedBankId(acc.id)}
              className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-zinc-900 border-amber-400 shadow-xl shadow-amber-500/10'
                  : 'bg-zinc-950 border-zinc-800/80 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-200">{acc.banco}</span>
                <div className="flex items-center gap-2">
                  <button onClick={(event) => { event.stopPropagation(); handleEditBank(acc.id); }} className="text-zinc-500 hover:text-amber-400" title="Editar conta"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={(event) => { event.stopPropagation(); if (confirm('Excluir esta conta? Os lançamentos serão preservados sem o vínculo bancário.')) { deleteBankAccount(acc.id); setSelectedBankId(''); } }} className="text-zinc-500 hover:text-red-400" title="Excluir conta"><Trash2 className="w-3.5 h-3.5" /></button>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">{acc.tipo}</span>
                </div>
              </div>

              <div className="text-lg font-black font-mono text-amber-400 mb-2">
                R$ {acc.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              <div className="text-[10px] text-zinc-500 font-mono">
                Ag: {acc.agencia} • CC: {acc.conta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bank Transactions List */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Extrato de Movimentações ({selectedAccount?.banco})</h3>
            <span className="text-[10px] text-zinc-500">{bankTxs.length} lançamento(s) no período selecionado</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setMonthFilter('')} className={`px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer ${!monthFilter ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>Todos</button>
            <button onClick={() => setMonthFilter(monthKeyFromOffset(0))} className={`px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer ${monthFilter === monthKeyFromOffset(0) ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>Mês atual</button>
            <button onClick={() => setMonthFilter(monthKeyFromOffset(1))} className={`px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer ${monthFilter === monthKeyFromOffset(1) ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>Próximo mês</button>
            <input
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-200 font-mono"
              title="Escolher outro mês"
            />
          </div>
        </div>

        <div className="space-y-3">
          {bankTxs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhuma movimentação registrada para este banco no momento.
            </div>
          ) : (
            bankTxs.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-xs text-zinc-200">{tx.descricao}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Data: {tx.data} • {tx.categoria} • {tx.formaPagamento}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openNewTransactionModal(tx)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 cursor-pointer"
                    title="Editar lançamento"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {tx.financiamentoDetalhes?.contratoId && (
                    <button
                      onClick={() => handleDeleteLinkedContract(tx.financiamentoDetalhes!.contratoId, tx.descricao)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                      title="Excluir contrato completo e todas as parcelas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleTransactionStatus(tx.id)}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer ${tx.status === 'PAGO' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}
                  >
                    {tx.status === 'PAGO' ? 'Pago ✓' : 'Marcar pago'}
                  </button>
                  <div className="text-right font-mono font-bold text-sm">
                  <span
                    className={tx.tipo === 'RECEITA' ? 'text-emerald-400' : 'text-amber-400'}
                  >
                    {tx.tipo === 'RECEITA' ? '+' : '-'} R${' '}
                    {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
