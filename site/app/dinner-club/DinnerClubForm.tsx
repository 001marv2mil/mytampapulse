"use client";

import { useState } from "react";

const NEIGHBORHOODS = ["South Tampa", "Seminole Heights", "Ybor / Downtown", "Westshore", "St. Pete", "Somewhere else"];
const STYLES = ["Adventurous, order the weird thing", "Comfort food, done well", "Surprise me"];
const AGES = ["21 to 29", "30 to 39", "40 to 49", "50+"];

export default function DinnerClubForm() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [diningStyle, setDiningStyle] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [dietary, setDietary] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/dinner-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, neighborhood, diningStyle, ageRange, dietary }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Could not save your seat.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Could not save your seat. Try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🍽️</div>
        <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">Your seat is saved</h3>
        <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
          Check your email for confirmation. We&apos;ll send the restaurant and your table the morning of the dinner.
        </p>
      </div>
    );
  }

  const field = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pulse-orange/40 focus:border-pulse-orange bg-white";
  const label = "block text-gray-700 text-sm font-semibold mb-2";

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-orange-100 p-6 sm:p-8 shadow-sm space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="firstName">First name</label>
          <input id="firstName" className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Marv" required />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="neighborhood">Where are you coming from?</label>
        <select id="neighborhood" className={field} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required>
          <option value="">Pick one</option>
          {NEIGHBORHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="diningStyle">How do you eat?</label>
        <select id="diningStyle" className={field} value={diningStyle} onChange={(e) => setDiningStyle(e.target.value)} required>
          <option value="">Pick one</option>
          {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="ageRange">Age range</label>
        <select id="ageRange" className={field} value={ageRange} onChange={(e) => setAgeRange(e.target.value)} required>
          <option value="">Pick one</option>
          {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <p className="text-gray-400 text-xs mt-1.5">Only used to seat tables that click. Never shown publicly.</p>
      </div>

      <div>
        <label className={label} htmlFor="dietary">Allergies or dietary needs</label>
        <input id="dietary" className={field} value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Vegetarian, shellfish allergy, none" />
      </div>

      {status === "error" && <p className="text-red-600 text-sm">{message}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-pulse-orange hover:bg-pulse-orange/90 disabled:opacity-60 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
      >
        {status === "loading" ? "Saving your seat…" : "Save my seat →"}
      </button>
      <p className="text-gray-400 text-xs text-center">Free to join. You pay for your own dinner.</p>
    </form>
  );
}
