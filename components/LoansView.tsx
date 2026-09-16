"use client";

import { useEffect, useState } from "react";
import { Plus, Search, CheckCircle, AlertTriangle } from "lucide-react";
import { getLoans, getClients, addLoan, updateLoan, calculateInstallment, addTransaction, Loan, Client } from "@/lib/db";

export default function LoansView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");

  const [formData, setFormData] = useState({
    clientId: '',
    amount: 1000,
    interestRate: 5,
    installments: 12
  });

  const loadData = async () => {
    setLoading(true);
    const [fetchedLoans, fetchedClients] = await Promise.all([getLoans(), getClients()]);
    setLoans(fetchedLoans);
    setClients(fetchedClients);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) return;

    const { totalAmount, installmentValue } = calculateInstallment(
      Number(formData.amount), 
      Number(formData.interestRate), 
      Number(formData.installments)
    );

    await addLoan({
      clientId: client.id!,
      clientName: client.name,
      amount: Number(formData.amount),
      interestRate: Number(formData.interestRate),
      installments: Number(formData.installments),
      installmentValue,
      totalAmount,
      remainingAmount: totalAmount,
      status: 'Ativo'
    });

    await addTransaction({
      clientId: client.id!,
      clientName: client.name,
      loanId: 'novo_emprestimo', // Ideally we use the new doc id, but simplified here
      amount: Number(formData.amount),
      paymentMethod: 'Transferência Bancária',
      type: 'Desembolso'
    });

    setIsModalOpen(false);
    setFormData({ clientId: '', amount: 1000, interestRate: 5, installments: 12 });
    loadData();
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    // We assume 1 installment payment at a time for simplicity
    const paymentAmount = selectedLoan.installmentValue;
    const newRemaining = Math.max(0, selectedLoan.remainingAmount - paymentAmount);
    const newStatus = newRemaining === 0 ? 'Pago' : 'Ativo';

    await updateLoan(selectedLoan.id!, { 
      remainingAmount: newRemaining,
      status: newStatus
    });

    await addTransaction({
      clientId: selectedLoan.clientId,
      clientName: selectedLoan.clientName,
      loanId: selectedLoan.id!,
      amount: paymentAmount,
      paymentMethod,
      type: 'Pagamento'
    });

    setIsPaymentModalOpen(false);
    setSelectedLoan(null);
    loadData();
  };

  const markAsLate = async (id: string) => {
    await updateLoan(id, { status: 'Atrasado' });
    loadData();
  };

  const markAsPaid = async (id: string) => {
    await updateLoan(id, { status: 'Pago', remainingAmount: 0 });
    loadData();
  };

  const filteredLoans = loans.filter(l => l.clientName.toLowerCase().includes(search.toLowerCase()));

  // Derived calculations for preview
  const preview = calculateInstallment(formData.amount, formData.interestRate, formData.installments);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Empréstimos</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Gerencie os contratos de microcrédito.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span>Novo Empréstimo</span>
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950/50 text-neutral-500 dark:text-neutral-400 text-sm">
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Valor Principal</th>
                <th className="px-6 py-4 font-medium">Prestações</th>
                <th className="px-6 py-4 font-medium">Restante</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">Carregando...</td></tr>
              ) : filteredLoans.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">Nenhum empréstimo encontrado.</td></tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{loan.clientName}</div>
                      <div className="text-xs text-neutral-500">{loan.interestRate}% ao mês</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100 font-medium">
                      MT {loan.amount.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-neutral-900 dark:text-neutral-100">{loan.installments}x de MT {loan.installmentValue.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}</div>
                      <div className="text-xs text-neutral-500">Total: MT {loan.totalAmount.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100 font-medium">
                      MT {loan.remainingAmount.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        loan.status === 'Ativo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        loan.status === 'Atrasado' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status !== 'Pago' && (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => { setSelectedLoan(loan); setIsPaymentModalOpen(true); }} className="p-2 text-neutral-400 hover:text-green-600 transition-colors bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 flex items-center space-x-1" title="Registrar Pagamento">
                            <CheckCircle size={16} />
                            <span className="text-xs font-medium px-1">Pagar</span>
                          </button>
                          {loan.status !== 'Atrasado' && (
                            <button onClick={() => markAsLate(loan.id!)} className="p-2 text-neutral-400 hover:text-red-600 transition-colors" title="Marcar como Atrasado">
                              <AlertTriangle size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPaymentModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm max-h-[100dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Registrar Pagamento</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">&times;</button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  Registrando pagamento de 1 parcela para <strong className="text-neutral-900 dark:text-white">{selectedLoan.clientName}</strong>.
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Valor da Parcela</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">MT {selectedLoan.installmentValue.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Método de Pagamento</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-100">
                  <option value="Dinheiro">Dinheiro (Espécie)</option>
                  <option value="Pix">Pix / Transferência</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">Confirmar Pagamento</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[100dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Simular & Aprovar Empréstimo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">&times;</button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Cliente</label>
                <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-100">
                  <option value="">Selecione um cliente...</option>
                  {clients.filter(c => c.status !== 'Inativo').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor Principal (MT)</label>
                  <input required type="number" min="100" step="100" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Taxa de Juros (% a.m.)</label>
                  <input required type="number" min="1" step="0.5" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: Number(e.target.value)})} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Número de Prestações (Meses)</label>
                <input required type="number" min="1" max="60" value={formData.installments} onChange={e => setFormData({...formData, installments: Number(e.target.value)})} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-100" />
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Resumo da Simulação</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block">Total a Pagar</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">MT {preview.totalAmount.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block">Valor da Parcela</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">MT {preview.installmentValue.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={!formData.clientId} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">Aprovar Crédito</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
