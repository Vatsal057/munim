import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center p-8 text-center gap-8 max-w-sm mx-auto">
      <div className="flex flex-col items-center gap-3 mt-8">
        <h1 className="text-3xl font-bold">Munim</h1>
        <p className="text-lg text-gray-700">
          Your munim on your phone. Tell it what happened. It tells you what to do.
        </p>
      </div>

      <p className="text-sm text-gray-500">
        You pay the wholesaler before your customers pay you. Every week you&apos;re short of cash,
        and nobody warns you — until now.
      </p>

      <div className="flex flex-col gap-4 w-full text-left">
        <div className="flex gap-3 items-start">
          <span className="text-2xl">🎙️</span>
          <div>
            <p className="font-semibold">1. Tell</p>
            <p className="text-sm text-gray-500">Say it, snap a photo, or type it. No forms.</p>
          </div>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-2xl">☀️</span>
          <div>
            <p className="font-semibold">2. Today</p>
            <p className="text-sm text-gray-500">One card tells you what to do today.</p>
          </div>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-2xl">💸</span>
          <div>
            <p className="font-semibold">3. Get paid</p>
            <p className="text-sm text-gray-500">A reminder, a payment link, a QR — one tap to send.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full mt-4">
        <Link href="/signup" className="bg-black text-white rounded-lg py-4 text-lg font-semibold">
          Start free
        </Link>
        <Link href="/demo" className="text-sm text-gray-500 underline">
          See a demo
        </Link>
      </div>
    </div>
  );
}
