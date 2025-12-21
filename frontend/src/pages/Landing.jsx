import React from "react";

import heroBg from "../assets/landing/hero-bg.png";
import sectionBg from "../assets/landing/section-bg.png";
import storyBg from "../assets/landing/story-bg.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0b1220]">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* NAV */}
        <nav className="relative z-10 mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#f6c94b]/20 border border-[#f6c94b]/40" />
              <div className="text-white font-extrabold text-xl tracking-wide">
                PBX
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm text-white/85">
              <a href="#pricing" className="hover:text-white transition">
                Pricing
              </a>
              <a href="#security" className="hover:text-white transition">
                Security
              </a>
              <a href="#faq" className="hover:text-white transition">
                FAQ
              </a>
              <a
                href="/login"
                className="rounded-xl bg-[#f6c94b] px-5 py-2.5 font-extrabold text-[#1b1b1b] shadow hover:brightness-105 transition"
              >
                Try the Demo
              </a>
            </div>
          </div>
        </nav>

        {/* HERO BODY */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT */}
            <div className="text-white">
              <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight">
                Know exactly what
                <br />
                arrives in PHP—
                <br />
                <span className="italic text-white/85">before you send.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-white/80 leading-relaxed">
                Built for overseas Filipinos. Clear estimates, secure
                infrastructure, and peace of mind for families back home.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="/login"
                  className="inline-flex justify-center rounded-2xl bg-[#f6c94b] px-8 py-4 font-extrabold text-[#1b1b1b] shadow-lg hover:brightness-105 transition"
                >
                  Try the Demo
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex justify-center rounded-2xl bg-white/10 border border-white/25 px-8 py-4 font-bold text-white hover:bg-white/15 transition"
                >
                  How PBX Works →
                </a>
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-[28px] bg-white/90 backdrop-blur border border-white/30 shadow-2xl p-6">
                <div className="text-sm text-slate-600 font-semibold">
                  Demo Preview
                </div>

                <div className="mt-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Clear Pricing Preview
                  </h3>

                  <div className="mt-4 divide-y divide-slate-200 text-sm">
                    <div className="flex justify-between py-3">
                      <span>Estimated FX Rate</span>
                      <span className="font-extrabold">₱58.25 / $1</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span>Fees</span>
                      <span className="font-extrabold">Shown in demo</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span>Availability</span>
                      <span className="font-extrabold">Varies by partner</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                  Demo estimates are illustrative only. Actual rates, fees, and
                  availability will vary and are subject to partner pricing.
                </p>

                <a
                  href="/login"
                  className="mt-4 inline-flex w-full justify-center rounded-2xl bg-[#f6c94b] px-6 py-3.5 font-extrabold text-[#1b1b1b] shadow hover:brightness-105 transition"
                >
                  Try the Demo
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* soft divider */}
        <div className="h-12 bg-gradient-to-b from-transparent to-[#f7f1e6]" />
      </section>

      {/* FX BAR */}
      <section
        className="py-8"
        style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex flex-col items-center gap-1">
            <div className="font-extrabold text-slate-800">
              USD → PHP Indicative Rate
              <span className="ml-2 text-xs bg-[#f6c94b]/70 px-2 py-0.5 rounded">
                Real-time
              </span>
            </div>
            <div className="text-sm text-slate-600">
              Updated moments ago
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-16 bg-[#0A2540]"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl text-white">
              Why PBX is Different
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-white/70">
              Built for the Filipino community, with transparency at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-[#f6c94b]/20 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[#f6c94b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">Built for Trust</h3>
              <p className="text-white/70 leading-relaxed">
                Platform-first design using regulated financial infrastructure. Your money moves through secure, compliant channels.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-[#f6c94b]/20 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[#f6c94b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">Know the Cost Before You Send</h3>
              <p className="text-white/70 leading-relaxed">
                Clear estimates before committing — no surprises. See exactly what your family receives in PHP.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-[#f6c94b]/20 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[#f6c94b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">Filipino-First</h3>
              <p className="text-white/70 leading-relaxed">
                Designed for OFWs and families back home. Every feature built with the Filipino experience in mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="py-16"
        style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-slate-900">
            Fair pricing that rewards sending more
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-slate-700">
            PBX uses tiered pricing with capped fees — designed for overseas
            Filipinos who support family regularly.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Tier title="Starter" price="$1 – $250" note="Ideal for small sends" />
            <Tier title="Family" price="$2.99 fee" note="Most popular" />
            <Tier title="OFW Plus" price="$4.99 fee" note="Best value" />
            <Tier
              title="Bayani Max"
              price="$7.99 max fee"
              note="Capped pricing"
              highlight
            />
          </div>

          <p className="mt-8 text-xs text-slate-600">
            Demo pricing shown for illustration only. Actual fees, rates, and
            availability will vary and are subject to partner pricing.
          </p>

          <a
            href="/login"
            className="mt-6 inline-flex justify-center rounded-2xl bg-[#f6c94b] px-10 py-4 font-extrabold text-[#1b1b1b] shadow hover:brightness-105 transition"
          >
            Try the Demo
          </a>
        </div>
      </section>

      {/* STORY */}
      <section
        className="py-24"
        style={{
          backgroundImage: `url(${storyBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="font-serif text-4xl md:text-5xl text-slate-900">
            For our <span className="font-extrabold">kababayan</span>, built for
            home.
          </h3>
          <p className="mt-4 text-lg text-slate-700">
            Sending money isn't just a transaction. It's groceries, tuition,
            medicine, and peace of mind.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#101827] py-10">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/60">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-2xl bg-[#f6c94b]/20 border border-[#f6c94b]/40" />
            <div className="font-extrabold text-white">PBX</div>
            <div className="text-white/50">Philippine Bayani Exchange</div>
          </div>
          <p>
            PBX is a financial technology platform and does not provide banking
            or money transmission services directly. Services may be provided by
            licensed financial partners where required. Demo estimates shown;
            actual rates, fees, and availability vary and are subject to partner
            pricing.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Tier({ title, price, note, highlight }) {
  return (
    <div
      className={`rounded-2xl bg-white/80 border border-slate-200 p-6 shadow-sm ${
        highlight ? "ring-2 ring-[#f6c94b]/60" : ""
      }`}
    >
      <div className="font-extrabold text-slate-900">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{price}</div>
      <div className="mt-2 text-slate-700">{note}</div>
    </div>
  );
}

export { Landing };
