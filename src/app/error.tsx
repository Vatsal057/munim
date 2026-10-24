"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
      <p className="text-lg font-semibold">Something went wrong.</p>
      <p className="text-sm text-gray-500">Try again, or go back and try a different way.</p>
      <button onClick={reset} className="bg-black text-white rounded-lg px-6 py-3 font-semibold">
        Try again
      </button>
    </div>
  );
}
