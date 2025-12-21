// PBX Landing Page — CRA/React (JavaScript)
// - Single HERO (bilingual) + About section (removes duplication)
// - RatePreview demo (mock), a11y labels, data-cta attributes
// - TailwindCSS expected

import React, { useMemo, useState } from "react";

export const Landing = () => {
  return (
    <main id="main-content" className="min-h-screen bg-white text-slate-800 selection:bg-yellow-200">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] rounded bg-sky-700 px-3 py-2 text-white"
      >
        Skip to content
      </a>

      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400" aria-hidden />
            <span className="text-xl font-bold tracking-tight">PBX</span>
            <span className="ml-2 hidden sm:inline text-slate-500">Philippine Bayani Exchange</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="hover:text-slate-900 text-slate-600">How it works</a>
            <a href="#features" className="hover:text-slate-900 text-slate-600">Features</a>
            <a href="#faq" className="hover:text-slate-900 text-slate-600">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#demo"
              data-cta="see-demo"
              className="hidden sm:inline rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              See demo
            </a>
            <a
              href="#join"
              data-cta="get-early-access"
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
            >
              Get early access
            </a>
          </div>
        </div>
      </header>

      {/* HERO (single, bilingual) */}
      <section className="relative overflow-hidden">
        {/* Philippine Flag Gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-900 via-red-700 to-yellow-400" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-80" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-center md:text-left">
              <span className="text-yellow-300 drop-shadow-md">Send money home</span>
              <br />
              <span className="text-white drop-shadow-md">with clarity and security.</span>
            </h1>

            <p className="mt-3 text-sm text-white/90 text-center md:text-left max-w-lg">
              Built for overseas Filipinos. This demo illustrates how transfers can be handled through 
              secure financial infrastructure.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 md:justify-start justify-center">
              <a
                href="#join"
                data-cta="get-started"
                className="rounded-xl bg-white text-sky-700 px-5 py-3 text-base font-semibold shadow hover:bg-slate-100"
              >
                Get Started
              </a>
              <a
                href="#how"
                data-cta="learn-more"
                className="rounded-xl border border-white/60 px-5 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Learn more
              </a>
            </div>

            {/* Test Mode Demo Button */}
            <div className="mt-6 text-center md:text-left">
              <a
                href="/login"
                data-cta="try-demo"
                className="inline-block rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-6 py-3 text-base font-bold shadow-lg hover:from-yellow-500 hover:to-yellow-600 transform hover:scale-105 transition-all"
              >
                Try the Demo
              </a>
              <p className="mt-2 text-xs text-white/80">
                Sandbox demo using test data only — no real funds move.
              </p>
            </div>
          </div>

          {/* Demo card with RatePreview */}
          <div className="relative">
            <div className="rounded-2xl border border-white/20 shadow-xl p-4 bg-white/95 backdrop-blur">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-slate-500">PBX • Demo</span>
                </div>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Balance</div>
                    <div className="text-3xl font-bold">$1,250.00</div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4" id="demo">
                    <div className="text-sm font-medium">Send USD → PHP</div>
                    <RatePreview />
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="text-sm font-medium">Recent activity</div>
                    <ul className="mt-2 text-sm text-slate-600 space-y-1">
                      <li>✔ $200 → GCash • Completed</li>
                      <li>✔ $500 → BPI • Completed</li>
                      <li>⏳ $75 → GCash • Pending</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-yellow-300/40 blur-2xl"
              aria-hidden
            />
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm animate-bounce">
          ↓ Learn how PBX works
        </div>
      </section>

      {/* ABOUT (replaces the duplicate hero) */}
      <section id="about" className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800">Built for the Heroes Who Build Home</h2>
          <p className="mt-4 text-slate-600 text-lg max-w-3xl mx-auto">
            Philippine Bayani Exchange (PBX) empowers overseas Filipinos to support their families with speed,
            security, and transparency. Every transfer carries love, dreams, and legacy — connecting hearts across borders.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="#demo"
              data-cta="see-demo"
              className="rounded-xl bg-sky-600 px-5 py-3 text-white font-semibold shadow hover:bg-sky-700"
            >
              See the Demo
            </a>
            <a
              href="#join"
              data-cta="join-early-access"
              className="rounded-xl border border-sky-600 px-5 py-3 text-sky-600 font-semibold hover:bg-sky-50"
            >
              Join Early Access
            </a>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Trust strip" className="py-8 border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs uppercase tracking-widest text-slate-500">
            Built on trusted infrastructure (illustrative)
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 opacity-80">
            <span className="text-sm font-medium">Plaid (Bank connections)</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium">Circle (USDC rails)</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium">Secure Cloud</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">How PBX works</h2>
          <p className="mt-2 text-slate-600">Three simple steps. Our demo shows how PBX will connect banks, stablecoins, and Philippine wallets once live.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Connect your bank", d: "Link a U.S. bank account via Plaid in seconds (sandbox in MVP)." },
              { n: "02", t: "Convert to stablecoin", d: "We illustrate USDC conversion on Circle rails for speed and transparency." },
              { n: "03", t: "Deliver to PH", d: "Send to GCash or PH bank accounts. Track status in real time." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 p-6">
                <div className="text-sm font-semibold text-slate-400">{s.n}</div>
                <div className="mt-1 text-xl font-bold">{s.t}</div>
                <p className="mt-2 text-slate-600 text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">Why teams choose PBX</h2>
          <p className="mt-2 text-slate-600">Designed for financial innovators who want speed, trust, and compliance from day one.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Fast transfers", d: "Move value quickly with an instant, modern UX." },
              { t: "Transparent fees", d: "No surprises—clear preview before you send." },
              { t: "Global-grade security", d: "Best-practice encryption, tokenization, and audit logs." },
              { t: "KYC-ready design", d: "Built to integrate with identity providers when we go live." },
              { t: "Multi-destination", d: "GCash, bank accounts, and more to come." },
              { t: "Admin insights", d: "View volumes, user activity, and risk flags at a glance." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-lg font-bold">{f.t}</div>
                <p className="mt-2 text-slate-600 text-sm">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="join" className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold">Be first to try PBX</h3>
          <p className="mt-2 text-slate-600">Join the early access list. We'll notify you when the live pilot opens.</p>
          <form
            className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full sm:w-80 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              data-cta="request-access"
              className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Request access
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">We'll only email about PBX launch and updates. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold">FAQs</h3>
          <div className="mt-6 grid gap-6">
            <details className="rounded-xl border border-slate-200 p-4 bg-white">
              <summary className="font-semibold cursor-pointer">Is the MVP moving real money?</summary>
              <p className="mt-2 text-sm text-slate-600">
                No. This demo uses sandbox data only — no real funds move in the MVP.
              </p>
            </details>

            <details className="rounded-xl border border-slate-200 p-4 bg-white">
              <summary className="font-semibold cursor-pointer">Which partners are involved?</summary>
              <p className="mt-2 text-sm text-slate-600">
                PBX integrates with trusted infrastructure providers. For example, we illustrate bank connectivity using Plaid and stablecoin rails using Circle (USDC). These references are illustrative in the demo; production partners and configurations may vary by jurisdiction.
              </p>
            </details>

            <details className="rounded-xl border border-slate-200 p-4 bg-white">
              <summary className="font-semibold cursor-pointer">Can I try it today?</summary>
              <p className="mt-2 text-sm text-slate-600">
                Yes—the interactive demo is available now with sample data. Join the early access list to be notified when the live pilot opens.
              </p>
            </details>

            <details className="rounded-xl border border-slate-200 p-4 bg-white">
              <summary className="font-semibold cursor-pointer">Is PBX a bank or money transmitter?</summary>
              <p className="mt-2 text-sm text-slate-600">
                PBX is not a bank. We're building a technology platform that will work with licensed partners where required. Availability, limits, and timing may vary by destination and payout provider.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400" aria-hidden />
            <span className="font-semibold">PBX</span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-500">Philippine Bayani Exchange</span>
          </div>
          <p className="text-xs text-slate-500 text-center md:text-right max-w-2xl">
            © {new Date().getFullYear()} PBX. Demo experience using sandbox data; no real funds move. 
            PBX is not a bank or licensed money transmitter at this stage. Services may be provided by licensed partners where required. 
            Availability, limits, and timing vary by destination and payout partner. 
            "Plaid" and "Circle" are trademarks of their respective owners and are used here illustratively.
          </p>
        </div>
      </footer>
    </main>
  );
};

/* --- Demo rate preview component (JS) --- */
function RatePreview() {
  const [usd, setUsd] = useState("");
  const [route, setRoute] = useState("gcash");

  // MOCK VALUES (demo only)
  const fx = 58.25;
  const fee = 2.99;
  const spread = 0.004;

  const parsed = parseFloat(usd) || 0;
  const php = useMemo(() => {
    const netUsd = Math.max(parsed - fee, 0) * (1 - spread);
    return Math.floor(netUsd * fx);
  }, [parsed]);

  return (
    <form className="mt-3 grid gap-3" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-2">
        <label htmlFor="amount" className="text-xs text-slate-500">Amount in USD</label>
        <input
          id="amount"
          inputMode="decimal"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Amount in USD"
          value={usd}
          onChange={(e) => setUsd(e.target.value)}
          aria-label="Amount in USD"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="dest" className="text-xs text-slate-500">Destination</label>
        <select
          id="dest"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          aria-label="Destination wallet or bank"
        >
          <option value="gcash">GCash Wallet</option>
          <option value="bank">Bank Account (PH)</option>
        </select>
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Est. rate</span>
          <span className="font-medium">₱{fx.toFixed(2)} / $1</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Fee</span>
          <span className="font-medium">${fee.toFixed(2)} (demo)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">FX spread</span>
          <span className="font-medium">{(spread * 100).toFixed(1)}% (demo)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-base">
          <span className="font-semibold">You'll send (est.)</span>
          <span className="font-bold">₱{php.toLocaleString()}</span>
        </div>
      </div>

      <button
        type="button"
        data-cta="preview-transfer"
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
      >
        Preview transfer
      </button>
      
      <p className="mt-2 text-xs text-slate-500 text-center">
        Demo rates shown are illustrative only. Actual rates, fees, and 
        availability will vary and are subject to partner pricing.
      </p>
    </form>
  );
}
