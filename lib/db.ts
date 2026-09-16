import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Inadimplente' | 'Inativo';
  createdAt?: any;
}

export interface Loan {
  id?: string;
  clientId: string;
  clientName: string;
  amount: number;
  interestRate: number; // percentage per month
  installments: number;
  installmentValue: number;
  totalAmount: number;
  remainingAmount: number;
  status: 'Ativo' | 'Atrasado' | 'Pago';
  startDate?: any;
}

export interface Transaction {
  id?: string;
  clientId: string;
  clientName: string;
  loanId: string;
  amount: number;
  paymentMethod: string;
  type: 'Pagamento' | 'Desembolso';
  date?: any;
}

// Clients
export const getClients = async () => {
  const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'clients'), {
    ...client,
    createdAt: serverTimestamp()
  });
};

export const updateClient = async (id: string, client: Partial<Client>) => {
  const ref = doc(db, 'clients', id);
  return await updateDoc(ref, client);
};

export const deleteClient = async (id: string) => {
  const ref = doc(db, 'clients', id);
  return await deleteDoc(ref);
};

// Loans
export const getLoans = async () => {
  const q = query(collection(db, 'loans'), orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
};

export const addLoan = async (loan: Omit<Loan, 'id' | 'startDate'>) => {
  return await addDoc(collection(db, 'loans'), {
    ...loan,
    startDate: serverTimestamp()
  });
};

export const updateLoan = async (id: string, loan: Partial<Loan>) => {
  const ref = doc(db, 'loans', id);
  return await updateDoc(ref, loan);
};

// Transactions
export const getTransactions = async () => {
  const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
  return await addDoc(collection(db, 'transactions'), {
    ...transaction,
    date: serverTimestamp()
  });
};

// Calculate Installments
export const calculateInstallment = (principal: number, rate: number, months: number) => {
  // Simple interest calculation for microcredit (commonly used):
  // Total = Principal + (Principal * Rate * Months)
  // Or compound interest, but usually microcredit uses simple or fixed fee.
  // We'll use simple interest per month on the principal for this implementation.
  const interestAmount = principal * (rate / 100) * months;
  const totalAmount = principal + interestAmount;
  const installmentValue = totalAmount / months;
  return {
    totalAmount,
    installmentValue
  };
};
