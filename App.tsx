
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Category, Entry, ViewType, Payment, StatSummary } from './types';
import { CATEGORIES, BANK_LIST, STATUS_COLORS } from './constants';
import { getFinancialInsights } from './services/geminiService';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TableView from './components/TableView';
import EntryModal from './components/EntryModal';
import PaymentModal from './components/PaymentModal';
import ConfirmModal from './components/ConfirmModal';
import HistoryModal from './components/HistoryModal';
import InsightsView from './components/InsightsView';

const App: React.FC = () => {
  // State
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('parchi_pro_v11');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeView, setActiveView] = useState<ViewType>(Category.CHAQUE_RECEIVABLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'party' | 'date' | 'bank'>('party');
  const [statFilter, setStatFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [monthFilter, setMonthFilter] = useState<'all' | 'current' | 'last'>('all');
  
  // Modal States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [paymentEntry, setPaymentEntry] = useState<Entry | null>(null);
  const [historyEntry, setHistoryEntry] = useState<Entry | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('parchi_pro_v11', JSON.stringify(entries));
  }, [entries]);

  // Derived Data & Filtering
  const filteredEntries = useMemo(() => {
    let result = entries;

    // View Filtering
    if (activeView !== 'dashboard' && activeView !== 'insights') {
      result = result.filter(e => e.category === activeView);
    }

    // Month Filtering
    if (monthFilter !== 'all') {
      const now = new Date();
      result = result.filter(e => {
        const entryDate = new Date(e.date);
        if (monthFilter === 'current') {
          return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
        } else {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          return entryDate.getMonth() === lastMonth && entryDate.getFullYear() === lastMonthYear;
        }
      });
    }

    // Search Filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => {
        if (searchType === 'party') return e.partyName.toLowerCase().includes(q);
        if (searchType === 'date') return e.date.includes(q);
        if (searchType === 'bank') return e.bankName?.toLowerCase().includes(q);
        return false;
      });
    }

    // Stat Filtering
    if (statFilter !== 'all') {
      result = result.filter(e => {
        const bal = e.totalAmount - e.payments.reduce((s, p) => s + p.amount, 0);
        if (statFilter === 'paid') return bal <= 0;
        if (statFilter === 'pending') return bal > 0 && e.status !== 'Overdue';
        if (statFilter === 'overdue') return bal > 0 && (e.status === 'Overdue' || e.status === 'Active');
        return true;
      });
    }

    return result;
  }, [entries, activeView, monthFilter, searchQuery, searchType, statFilter]);

  // Handlers
  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (entryData: Partial<Entry>) => {
    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...entryData } as Entry : e));
    } else {
      const newEntry: Entry = {
        id: Date.now().toString(),
        payments: [],
        status: 'Pending',
        ...entryData
      } as Entry;
      setEntries(prev => [...prev, newEntry]);
    }
    setIsEntryModalOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handlePayEntry = (entry: Entry) => {
    setPaymentEntry(entry);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (payment: Payment) => {
    if (!paymentEntry) return;
    setEntries(prev => prev.map(e => {
      if (e.id === paymentEntry.id) {
        const newPayments = [...e.payments, payment];
        const totalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
        return {
          ...e,
          payments: newPayments,
          status: totalPaid >= e.totalAmount ? 'Paid' : e.status
        };
      }
      return e;
    }));
    setIsPaymentModalOpen(false);
  };

  const handleConfirmUnknown = (entry: Entry) => {
    setPaymentEntry(entry);
    setIsConfirmModalOpen(true);
  };

  const handleSaveConfirmation = (id: string, customerName: string, confirmedBy: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, partyName: customerName, confirmedBy, status: 'Confirmed' } as Entry;
      }
      return e;
    }));
    setIsConfirmModalOpen(false);
  };

  const handleShowHistory = (entry: Entry) => {
    setHistoryEntry(entry);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar 
        activeView={activeView} 
        onViewChange={(v) => { setActiveView(v); setStatFilter('all'); }} 
        onAddEntry={handleAddEntry}
        searchType={searchType}
        setSearchType={setSearchType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">
            {activeView === 'dashboard' ? 'Executive Dashboard' : 
             activeView === 'insights' ? 'AI Smart Insights' : 
             activeView}
          </h1>

          {activeView !== 'dashboard' && activeView !== 'insights' && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-500">View Range:</label>
              <select 
                className="bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value as any)}
              >
                <option value="all">All Records</option>
                <option value="current">Current Month</option>
                <option value="last">Previous Month</option>
              </select>
            </div>
          )}
        </header>

        <div className="p-8">
          {activeView === 'dashboard' ? (
            <Dashboard entries={entries} onViewChange={setActiveView} />
          ) : activeView === 'insights' ? (
            <InsightsView entries={entries} />
          ) : (
            <TableView 
              entries={filteredEntries} 
              activeView={activeView as Category}
              statFilter={statFilter}
              onStatFilterChange={setStatFilter}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onPay={handlePayEntry}
              onConfirm={handleConfirmUnknown}
              onHistory={handleShowHistory}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {isEntryModalOpen && (
        <EntryModal 
          isOpen={isEntryModalOpen} 
          onClose={() => setIsEntryModalOpen(false)} 
          onSave={handleSaveEntry} 
          editingEntry={editingEntry}
          initialCategory={activeView as Category}
        />
      )}

      {isPaymentModalOpen && paymentEntry && (
        <PaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)} 
          entry={paymentEntry}
          onSave={handleSavePayment}
        />
      )}

      {isConfirmModalOpen && paymentEntry && (
        <ConfirmModal 
          isOpen={isConfirmModalOpen} 
          onClose={() => setIsConfirmModalOpen(false)} 
          entry={paymentEntry}
          onSave={handleSaveConfirmation}
        />
      )}

      {isHistoryModalOpen && historyEntry && (
        <HistoryModal 
          isOpen={isHistoryModalOpen} 
          onClose={() => setIsHistoryModalOpen(false)} 
          entry={historyEntry}
        />
      )}
    </div>
  );
};

export default App;
