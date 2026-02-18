"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function StudioStep1Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "1";
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href);
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("Studio");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/studio/step-1");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (typeof data?.companyName === "string") setCompanyName(data.companyName);
        if (typeof data?.businessType === "string") setBusinessType(data.businessType);
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
    if (companyName.trim().length < 2 || businessType.trim().length < 2) {
      setError("Bitte Name und Geschäftstyp ausfüllen (mind. 2 Zeichen).");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/onboarding/studio/step-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), businessType: businessType.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }
      router.push(addEditParam("/onboarding/studio/step-2"));
    } catch (err) {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  }

  // Edit-mode only: Save and return to dashboard
  async function onSaveAndReturn() {
    setError(null);
    // Reuse the same basic validation as normal submit
    if (companyName.trim().length < 2 || businessType.trim().length < 2) {
      setError("Bitte Name und Geschäftstyp ausfüllen (mind. 2 Zeichen).");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/onboarding/studio/step-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), businessType: businessType.trim() }),
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
            <div className="text-sm font-light tracking-widest text-gray-600">STUDIO • Schritt 1/3</div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-thin tracking-wider text-gray-800 mb-2">Unternehmensinformationen</h1>
            <p className="text-sm font-light text-gray-500">Firmendaten und Geschäftstyp</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6 border p-6 bg-gray-50">
            {error && (
              <div className="p-3 text-sm font-light text-red-700 bg-red-50 border border-red-200">{error}</div>
            )}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-1">Name</label>
              <input value={companyName} onChange={(e)=>setCompanyName(e.target.value)} className="w-full border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-light text-gray-700 mb-1">Geschäftstyp</label>
              <input value={businessType} onChange={(e)=>setBusinessType(e.target.value)} className="w-full border px-3 py-2 text-sm" />
            </div>

            <div className="flex justify-between pt-4">
              <Link href={addEditParam("/onboarding")} className="text-sm font-light text-gray-600 hover:text-pink-500">Zur Übersicht</Link>
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

