"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClubStep2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "1";
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/club/step-2");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (typeof data?.address === "string") setAddress(data.address);
        if (typeof data?.city === "string") setCity(data.city);
        if (typeof data?.country === "string") setCountry(data.country);
        if (typeof data?.phone === "string") setPhone(data.phone);
        if (typeof data?.email === "string") setEmail(data.email);
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, [isEditMode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (address.trim().length < 5 || city.trim().length < 2 || country.trim().length < 2 || phone.trim().length < 5) {
      setError("Bitte alle Pflichtfelder korrekt ausfüllen.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/onboarding/club/step-2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), city: city.trim(), country: country.trim(), phone: phone.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }
      router.push(addEditParam("/onboarding/club/step-3"));
    } catch (err) {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  }

  // Edit-mode only: Save and return to dashboard
  async function onSaveAndReturn() {
    setError(null);
    if (address.trim().length < 5 || city.trim().length < 2 || country.trim().length < 2 || phone.trim().length < 5) {
      setError("Bitte alle Pflichtfelder korrekt ausfüllen.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/onboarding/club/step-2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), city: city.trim(), country: country.trim(), phone: phone.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }
      router.push("/profile");
    } catch (err) {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href={addEditParam("/onboarding")} className="text-sm font-light tracking-widest text-gray-600 hover:text-pink-500">Zur Übersicht</Link>
            <div className="text-sm font-light tracking-widest text-gray-600">CLUB • Schritt 2/3</div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-thin tracking-wider text-gray-800 mb-2">Standort & Kontakt</h1>
            <p className="text-sm font-light text-gray-500">Adresse und Kontaktinformationen</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6 border p-6 bg-gray-50">
            {error && (
              <div className="p-3 text-sm font-light text-red-700 bg-red-50 border border-red-200">{error}</div>
            )}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-1">Adresse</label>
              <input value={address} onChange={(e)=>setAddress(e.target.value)} className="w-full border px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Stadt</label>
                <input value={city} onChange={(e)=>setCity(e.target.value)} className="w-full border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Land</label>
                <input value={country} onChange={(e)=>setCountry(e.target.value)} className="w-full border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Telefon</label>
                <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">E‑Mail</label>
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link href={addEditParam("/onboarding/club/step-1")} className="text-sm font-light text-gray-600 hover:text-pink-500">Zurück</Link>
              {isEditMode && (
                <button
                  type="button"
                  onClick={onSaveAndReturn}
                  disabled={isLoading}
                  className="bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-800 font-light tracking-widest px-4 py-2 text-sm uppercase mr-2"
                >
                  {isLoading ? "Speichern..." : "Speichern und zurück zum Dashboard"}
                </button>
              )}
              <button type="submit" disabled={isLoading} className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-light tracking-widest px-8 py-2 text-sm uppercase">{isLoading ? "Speichern..." : "Weiter"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

