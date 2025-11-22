import React from "react";

export default function RecipientSelect({ recipients, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-300">
        Recipient
      </label>

      <select
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {recipients.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.handle}) • {r.country} •{" "}
            {r.payoutMethod?.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
