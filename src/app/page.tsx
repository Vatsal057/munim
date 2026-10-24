import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/60 text-slate-900 pb-12">
      {/* Top Brand Bar */}
      <nav className="w-full max-w-md mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm">
            M
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Munim</span>
        </div>
        <Link
          href="/demo"
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
        >
          Try 5 Demo Shops →
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="max-w-md mx-auto px-6 pt-4 pb-8 flex flex-col gap-6 text-center">
        <div className="inline-flex items-center justify-center gap-1.5 self-center px-3.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium tracking-wide shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Simple as UPI for business</span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl text-balance leading-tight">
            Your munim on your phone.
          </h1>
          <p className="text-base text-slate-600 font-medium leading-relaxed text-balance">
            Tell it what happened. It tells you what to do.
            <br />
            <strong className="text-slate-900 font-semibold">Get paid before you have to pay.</strong>
          </p>
        </div>

        {/* Live Card Preview (The Cash Gap) */}
        <div className="w-full text-left bg-white rounded-2xl p-5 border border-slate-200/90 shadow-md flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>☀️</span> Today&apos;s Munim Briefing
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60">
              ₹2,500 gap
            </span>
          </div>

          <p className="text-sm text-slate-800 leading-snug font-medium">
            You owe Shree Wholesale <strong className="text-slate-950">₹8,000 on Friday</strong>. You&apos;ll likely collect <strong className="text-slate-950">₹5,500</strong> by then: <span className="text-rose-600 font-semibold">₹2,500 short</span>. Remind these 4 customers.
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-[10px] font-bold text-slate-700 flex items-center justify-center">S</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-200 text-[10px] font-bold text-amber-900 flex items-center justify-center">A</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-200 text-[10px] font-bold text-indigo-900 flex items-center justify-center">M</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-200 text-[10px] font-bold text-emerald-900 flex items-center justify-center">+1</div>
            </div>
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
              Review Reminders →
            </span>
          </div>
        </div>

        {/* 3 Step Flow */}
        <div className="flex flex-col gap-3 text-left pt-2">
          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 border border-slate-200/80 flex gap-3.5 items-start">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 text-xl shadow-xs">
              🎙️
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">1. Tell (Show or Speak)</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                Snap a khata notebook page, upload a supplier bill, or speak in Kannada, Hindi, or English. Zero typing.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 border border-slate-200/80 flex gap-3.5 items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 text-xl shadow-xs">
              ☀️
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">2. Today (One Clear Answer)</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                No complex reports or ledger math. One simple morning card tells you who owes what and who is due to pay.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 border border-slate-200/80 flex gap-3.5 items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 text-xl shadow-xs">
              💳
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">3. Get Paid (One-Tap WhatsApp)</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                Pre-drafted polite reminders carry a payment link and UPI QR. Customer pays from home, due clears instantly.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/signup"
            className="w-full bg-slate-950 text-white rounded-xl py-4 px-6 text-base font-bold shadow-md hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Start Free for Your Shop</span>
            <span>→</span>
          </Link>
          <Link
            href="/demo"
            className="w-full bg-white text-slate-700 border border-slate-200/90 rounded-xl py-3.5 px-6 text-sm font-semibold shadow-xs hover:bg-slate-50 transition-colors"
          >
            Explore 5 Sample Businesses (Ramesh, Sunita, etc.)
          </Link>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-4 flex flex-col gap-1 items-center text-xs text-slate-500">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="text-emerald-600 font-bold">✓</span> No credit card required · Works on any phone
          </p>
          <p className="text-[11px] text-slate-400">
            &ldquo;UPI made paying one tap. We make running a business one sentence.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

