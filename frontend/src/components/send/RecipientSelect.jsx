import React from "react";

// Theme colors
const theme = {
  navy: '#0A2540',
  gold: '#F6C94B',
};

export default function RecipientSelect({ recipients, value, onChange }) {
  return (
    <select
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ color: theme.navy }}
    >
      {recipients.map((r) => (
        <option key={r.id} value={r.id} className="bg-white text-slate-900">
          {r.name} ({r.handle}) • {r.country} •{" "}
          {r.payoutMethod?.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
