"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import ClientsView from '@/components/ClientsView';
import LoansView from '@/components/LoansView';
import ReportsView from '@/components/ReportsView';
import { Lock, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [currentView, setCurrentView] = useState('dashboard');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          // Auto-create user if it doesn't exist for easier preview usage
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr: any) {
          setError('Falha na autenticação: ' + createErr.message);
        }
      } else {
        setError('Falha na autenticação: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 transition-colors">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 transition-colors p-4">
        <div className="bg-white dark:bg-neutral-950 p-8 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md animate-in fade-in zoom-in-95">
          <div className="flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
            <Lock size={48} className="mb-4" />
            <h1 className="text-2xl font-bold">MicroGestor Seguros</h1>
            <p className="text-sm text-neutral-500 text-center mt-2">
              Acesso restrito a gestores financeiros
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm rounded-lg text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">E-mail Corporativo</label>
              <input 
                required 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@microcredito.com" 
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-50" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Senha</label>
              <input 
                required 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-50" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors mt-2 flex justify-center items-center h-12"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continuar'}
            </button>
            <p className="text-xs text-center text-neutral-500 mt-4">
              Se a conta não existir, ela será criada automaticamente.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-900 transition-colors duration-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'clients' && <ClientsView />}
          {currentView === 'loans' && <LoansView />}
          {currentView === 'reports' && <ReportsView />}
        </div>
      </main>
    </div>
  );
}
