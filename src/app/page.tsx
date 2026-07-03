import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-[420px] bg-canvas rounded-2xl p-9 shadow-2xl">
        <div className="text-xs tracking-widest text-gray-500 font-mono mb-2">SENUS · BOARD REPORT</div>
        <h1 className="font-display text-3xl font-semibold mb-2">Natural Capital,<br />measured in euros.</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          FY2024–FY2025 audited financials, modelled against the Senus 2030 strategy.
        </p>
        <Link
          href="/dashboard"
          className="block w-full text-center bg-ink text-white rounded-lg py-3 font-semibold hover:opacity-90 transition"
        >
          Enter Board Report
        </Link>
      </div>
    </main>
  );
}
