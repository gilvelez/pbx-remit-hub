/**
 * Statements Page - Transaction history and PDF export
 * Date range filter, category filter, download PDF
 */
import React, { useState, useEffect } from "react";
import { getStatements, exportStatementPdf } from "../../lib/recipientApi";

export default function Statements() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const data = await getStatements({
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        type: typeFilter || undefined,
        currency: currencyFilter || undefined,
        limit: 50,
      });
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Failed to fetch statements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const handleFilter = () => {
    fetchStatements();
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const result = await exportStatementPdf(dateRange.start, dateRange.end);
      alert(`Statement generated: ${result.filename}`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'credit':
        return { icon: '↓', bg: 'bg-green-100', color: 'text-green-600' };
      case 'fx_conversion':
        return { icon: '↔', bg: 'bg-blue-100', color: 'text-blue-600' };
      case 'bill_payment':
        return { icon: '📄', bg: 'bg-amber-100', color: 'text-amber-600' };
      case 'transfer_out':
        return { icon: '↑', bg: 'bg-purple-100', color: 'text-purple-600' };
      default:
        return { icon: '•', bg: 'bg-gray-100', color: 'text-gray-600' };
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3B]">Statements</h1>
          <p className="text-gray-500 text-sm">View and export your transaction history</p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1F3B] text-white rounded-lg font-medium hover:bg-[#0B1F3B]/90 transition disabled:opacity-50"
          data-testid="export-pdf-btn"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">From Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#0B1F3B] focus:ring-1 focus:ring-[#0B1F3B]/10 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#0B1F3B] focus:ring-1 focus:ring-[#0B1F3B]/10 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#0B1F3B] focus:ring-1 focus:ring-[#0B1F3B]/10 outline-none bg-white"
            >
              <option value="">All Types</option>
              <option value="credit">Credits</option>
              <option value="fx_conversion">FX Conversions</option>
              <option value="bill_payment">Bills</option>
              <option value="transfer_out">Transfers</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Currency</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#0B1F3B] focus:ring-1 focus:ring-[#0B1F3B]/10 outline-none bg-white"
            >
              <option value="">All</option>
              <option value="USD">USD</option>
              <option value="PHP">PHP</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full h-10 bg-[#0B1F3B]/10 text-[#0B1F3B] rounded-lg font-medium hover:bg-[#0B1F3B]/20 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="USD Received"
            value={`$${summary.total_credits_usd?.toLocaleString()}`}
            color="green"
          />
          <SummaryCard
            label="Converted to PHP"
            value={`₱${summary.total_conversions?.toLocaleString()}`}
            color="blue"
          />
          <SummaryCard
            label="Bills Paid"
            value={`₱${summary.total_bills_paid?.toLocaleString()}`}
            color="amber"
          />
          <SummaryCard
            label="Transfers Out"
            value={`₱${summary.total_transfers?.toLocaleString()}`}
            color="purple"
          />
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0B1F3B]">Transaction History</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3B]" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Description</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const { icon, bg, color } = getTypeIcon(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center`}>
                            <span className={color}>{icon}</span>
                          </div>
                          <span className="text-sm font-medium text-[#0B1F3B]">{tx.category}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{tx.description}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-[#0B1F3B]'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.currency === 'USD' ? '$' : '₱'}
                          {Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No transactions found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-[#0B1F3B]">{value}</p>
    </div>
  );
}
