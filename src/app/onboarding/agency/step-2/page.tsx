"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AgencyStep2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "1";
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/agency/step-2");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (typeof data?.description === "string") setDescription(data.description);
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (description.trim().length < 50) {
      setError("Beschreibung muss mindestens 50 Zeichen haben.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/onboarding/agency/step-2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }
      router.push(addEditParam("/onboarding/agency/step-3"));
    } catch {
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
            <Link href={addEditParam("/onboarding")} className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZURÜCK ZUM ONBOARDING
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">AGENTUR-EINRICHTUNG – SCHRITT 2/6</div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">BESCHREIBUNG</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">Unternehmensbeschreibung – Schritt 2 von 6</p>
            <div className="flex justify-center">
              <Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 2/6</Badge>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">{error}</div>
            )}
            <div>
              <label className="block text-xs font-light tracking-widest text-gray-700 uppercase mb-2">Beschreibung *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm font-light tracking-wide min-h-[180px] focus:outline-none focus:border-pink-500 transition-colors"
                placeholder="Beschreiben Sie Ihre Agentur, Ihre Philosophie und was Sie einzigartig macht (mind. 50 Zeichen)..."
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/50 Zeichen (Minimum)</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Button type="button" variant="outline" onClick={() => router.push(addEditParam("/onboarding/agency/step-1"))} className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none">
                Zurück
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none">
                {isLoading ? "Speichern..." : "Weiter zu Schritt 3"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
