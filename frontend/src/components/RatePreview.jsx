import React, { useMemo } from 'react';

export const RatePreview = ({ amount, quotedRate = 56.10, fee = 1.00 }) => {
  const calculation = useMemo(() => {
    const amountValue = parseFloat(amount) || 0;
    if (amountValue <= 0) return null;
    
    return {
      amountUSD: amountValue,
      estPhp: (amountValue * quotedRate).toFixed(2),
      fee: fee.toFixed(2),
      totalCost: (amountValue + fee).toFixed(2),
      rate: quotedRate
    };
  }, [amount, quotedRate, fee]);

  if (!calculation) {
    return (
      <div className="text-sm text-slate-500 py-2">
        Enter an amount to see the exchange rate
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center justify-between py-2 px-3 bg-sky-50 rounded-lg border border-sky-200">
        <span className="text-slate-600">They receive</span>
        <span className="font-bold text-sky-700">₱{calculation.estPhp}</span>
      </div>
      
      <div className="space-y-1 px-3">
        <div className="flex justify-between text-slate-600">
          <span>Rate</span>
          <span className="font-medium">1 USD = {calculation.rate} PHP</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Fee</span>
          <span className="font-medium">${calculation.fee}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold">
          <span>Total cost</span>
          <span>${calculation.totalCost}</span>
        </div>
      </div>
    </div>
  );
};
