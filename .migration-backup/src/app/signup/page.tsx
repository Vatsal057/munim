"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BUSINESS_TYPES = [
  { value: "kirana", label: "Kirana shop" },
  { value: "tiffin", label: "Tiffin service" },
  { value: "tailor", label: "Tailor" },
  { value: "cart", label: "Cart / vendor" },
  { value: "side_hustle", label: "Side hustle" },
  { value: "personal", label: "Personal" },
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("kirana");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        business_name: businessName,
        business_type: businessType,
        language,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error?.fieldErrors?.phone?.[0] ?? "Something went wrong. Try again.");
      return;
    }
    router.push("/app");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 max-w-sm mx-auto gap-5">
      <h1 className="text-2xl font-bold text-center">Let&apos;s set you up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg px-4 py-3 text-base"
            placeholder="Ramesh Kumar"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Phone number</span>
          <input
            required
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            className="border rounded-lg px-4 py-3 text-base"
            placeholder="9876543210"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Shop / business name</span>
          <input
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="border rounded-lg px-4 py-3 text-base"
            placeholder="Ramesh Kirana Store"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Business type</span>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="border rounded-lg px-4 py-3 text-base"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border rounded-lg px-4 py-3 text-base"
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="hi">हिन्दी</option>
          </select>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-lg py-4 text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Setting up…" : "Start free"}
        </button>
      </form>
    </div>
  );
}
