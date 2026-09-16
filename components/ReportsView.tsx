"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Filter } from "lucide-react";
import { getTransactions, getLoans, Transaction, Loan } from "@/lib/db";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ReportsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, late, paid

  useEffect(() => {
    const loadData = async () => {
      const [fetchedTx, fetchedLoans] = await Promise.all([getTransactions(), getLoans()]);
      setTransactions(fetchedTx);
      setLoans(fetchedLoans);
      setLoading(false);
    };
    loadData();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório MicroGestor", 14, 15);
    
    let reportData: (string | number)[][] = [];
    let headers: string[][] = [];

    if (filterType === 'all' || filterType === 'transactions') {
      doc.text("Histórico de Transações", 14, 25);
      headers = [["Data", "Cliente", "Tipo", "Método", "Valor (MT)"]];
      reportData = transactions.map(t => [
        t.date ? format(t.date.toDate(), 'dd/MM/yyyy') : '',
        t.clientName,
        t.type,
        t.paymentMethod || '-',
        t.amount.toFixed(2)
      ]);
    } else if (filterType === 'late') {
      doc.text("Relatório de Atrasos", 14, 25);
      headers = [["Cliente", "Restante (MT)", "Parcela (MT)"]];
      reportData = loans.filter(l => l.status === 'Atrasado').map(l => [
        l.clientName,
        l.remainingAmount.toFixed(2),
        l.installmentValue.toFixed(2)
      ]);
    } else if (filterType === 'paid') {
      doc.text("Relatório de Dívidas Pagas", 14, 25);
      headers = [["Cliente", "Total Pago (MT)"]];
      reportData = loans.filter(l => l.status === 'Pago').map(l => [
        l.clientName,
        l.totalAmount.toFixed(2)
      ]);
    } else if (filterType === 'active') {
      doc.text("Relatório de Empréstimos Ativos", 14, 25);
      headers = [["Cliente", "Valor Total (MT)", "Restante (MT)", "Parcela (MT)"]];
      reportData = loans.filter(l => l.status === 'Ativo').map(l => [
        l.clientName,
        l.totalAmount.toFixed(2),
        l.remainingAmount.toFixed(2),
        l.installmentValue.toFixed(2)
      ]);
    }

    (doc as any).autoTable({
      startY: 30,
      head: headers,
      body: reportData,
    });
    doc.save("relatorio_microgestor.pdf");
  };

  const exportCSV = () => {
    let csv = '';
    if (filterType === 'all' || filterType === 'transactions') {
      csv = 'Data,Cliente,Tipo,Metodo,Valor\n';
      transactions.forEach(t => {
        const date = t.date ? format(t.date.toDate(), 'dd/MM/yyyy') : '';
        csv += `${date},${t.clientName},${t.type},${t.paymentMethod || '-'},${t.amount}\n`;
      });
    } else if (filterType === 'late') {
      csv = 'Cliente,Restante,Parcela\n';
      loans.filter(l => l.status === 'Atrasado').forEach(l => {
        csv += `${l.clientName},${l.remainingAmount},${l.installmentValue}\n`;
      });
    } else if (filterType === 'paid') {
      csv = 'Cliente,Total Pago\n';
      loans.filter(l => l.status === 'Pago').forEach(l => {
        csv += `${l.clientName},${l.totalAmount}\n`;
      });
    } else if (filterType === 'active') {
      csv = 'Cliente,Valor Total,Restante,Parcela\n';
      loans.filter(l => l.status === 'Ativo').forEach(l => {
        csv += `${l.clientName},${l.totalAmount},${l.remainingAmount},${l.installmentValue}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "relatorio_microgestor.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedTransactions = transactions;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Relatórios Financeiros</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Gere relatórios, históricos e exporte dados.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={exportCSV} className="flex items-center space-x-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">
            <Download size={18} />
            <span>CSV</span>
          </button>
          <button onClick={exportPDF} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <FileText size={18} />
            <span>Gerar PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300">
          <Filter size={18} />
          <span className="font-medium">Tipo de Relatório:</span>
        </div>
        <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {['all', 'active', 'late', 'paid'].map(type => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterType === type 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                : 'bg-neutral-50 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {type === 'all' ? 'Transações (Histórico)' : type === 'active' ? 'Ativos' : type === 'late' ? 'Atrasos' : 'Dívidas Pagas'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
          <h3 className="font-medium text-neutral-700 dark:text-neutral-300">Visualização (Transações Recentes)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950/50 text-neutral-500 dark:text-neutral-400 text-sm">
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Método</th>
                <th className="px-6 py-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Carregando histórico...</td></tr>
              ) : displayedTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Nenhuma transação encontrada.</td></tr>
              ) : (
                displayedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 text-sm">
                      {tx.date ? format(tx.date.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{tx.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'Pagamento' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                      {tx.paymentMethod || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={tx.type === 'Pagamento' ? 'text-green-600 dark:text-green-400' : 'text-neutral-900 dark:text-neutral-100'}>
                        {tx.type === 'Pagamento' ? '+' : '-'} MT {tx.amount.toLocaleString('pt-MZ', {minimumFractionDigits: 2})}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
