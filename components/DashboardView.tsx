"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, Wallet, BellRing } from "lucide-react";
import { getClients, getLoans, getTransactions, Client, Loan, Transaction } from "@/lib/db";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [fetchedClients, fetchedLoans, fetchedTransactions] = await Promise.all([
        getClients(),
        getLoans(),
        getTransactions()
      ]);
      setClients(fetchedClients);
      setLoans(fetchedLoans);
      setTransactions(fetchedTransactions);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
    </div>;
  }

  const activeClients = clients.length;
  const totalDebt = loans
    .filter(l => l.status === 'Ativo' || l.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.remainingAmount, 0);

  // Initial Capital + Payments - Disbursements
  const initialCapital = 100000; // Simulated starting capital
  const totalPayments = transactions.filter(t => t.type === 'Pagamento').reduce((acc, t) => acc + t.amount, 0);
  const totalDisbursements = transactions.filter(t => t.type === 'Desembolso').reduce((acc, t) => acc + t.amount, 0);
  const availableBalance = initialCapital + totalPayments - totalDisbursements;

  const lateLoans = loans.filter(l => l.status === 'Atrasado');

  // Chart data simulation (Group transactions by day, simplified for preview)
  const chartData = [
    { name: 'Seg', recebimentos: 4000, emprestimos: 2400 },
    { name: 'Ter', recebimentos: 3000, emprestimos: 1398 },
    { name: 'Qua', recebimentos: 2000, emprestimos: 9800 },
    { name: 'Qui', recebimentos: 2780, emprestimos: 3908 },
    { name: 'Sex', recebimentos: 1890, emprestimos: 4800 },
    { name: 'Sáb', recebimentos: 2390, emprestimos: 3800 },
    { name: 'Dom', recebimentos: 3490, emprestimos: 4300 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Visão Geral</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Acompanhe a saúde financeira da sua operação.</p>
        </div>
        <button className="flex items-center space-x-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
          <BellRing size={18} />
          <span>Lembretes ({lateLoans.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total de Clientes" 
          value={activeClients.toString()} 
          icon={Users} 
          trend="+2% este mês"
          color="blue"
        />
        <StatCard 
          title="Dívida Ativa (A Receber)" 
          value={`MT ${totalDebt.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp}
          trend="Total pendente"
          color="orange"
        />
        <StatCard 
          title="Saldo em Caixa" 
          value={`MT ${availableBalance.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}`} 
          icon={Wallet}
          trend="Disponível para giro"
          color="green"
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-neutral-900 dark:text-neutral-50">Fluxo de Caixa (Semanal)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Line type="monotone" dataKey="recebimentos" name="Recebimentos" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="emprestimos" name="Empréstimos" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e', strokeWidth: 0}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  }[color as string];

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
        <div className={`p-2 rounded-xl ${colorClasses}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">{value}</h4>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{trend}</p>
      </div>
    </div>
  );
}
