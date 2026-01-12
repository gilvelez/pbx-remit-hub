import React, { useState, useEffect } from "react";
import { getTransfers, DELIVERY_METHODS } from "../../lib/mockApi";

export default function Activity() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransfers = async () => {
      const data = await getTransfers();
      setTransfers(data);
      setLoading(false);
    };
    loadTransfers();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-24 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Activity</h1>

      {transfers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">No transfers yet</h2>
          <p className="text-sm text-gray-500">Your transfer history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((transfer) => {
            const method = DELIVERY_METHODS.find(d => d.id === transfer.deliveryMethod);
            const date = new Date(transfer.createdAt);
            
            return (
              <div
                key={transfer.transferId}
                className="bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {transfer.recipient?.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-[#1A1A1A]">{transfer.recipient?.fullName}</div>
                      <div className="text-xs text-gray-500">{method?.name || 'Transfer'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#1A1A1A]">
                      ₱{transfer.amountPhp?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${transfer.amountUsd?.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    {transfer.status === 'completed' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-green-600">Completed</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-blue-600">Processing</span>
                      </>
                    )}
                  </div>
                  <span className="text-gray-500">
                    {date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
