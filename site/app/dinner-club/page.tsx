import DinnerClubForm from "./DinnerClubForm";
import { NEXT_DINNER_DATE, prettyDinnerDate } from "@/lib/dinner-club";

export const metadata = {
  title: "Tampa Pulse Dinner Club | Tampa Pulse",
  description:
    "Six Tampa Bay locals, one table, a restaurant you find out the morning of. Free to join, you pay for your own dinner.",
};

const STEPS = [
  { n: 1, title: "Answer five questions", body: "Where you're coming from, how you eat, and anything we need to know about allergies. Takes about a minute." },
  { n: 2, title: "We seat the table", body: "You get matched with five other Tampa Bay locals you have not met. We build tables that actually click." },
  { n: 3, title: "The spot drops that morning", body: "You find out the restaurant the morning of the dinner. Show up, order, talk to strangers. That is the whole thing." },
];

export default function DinnerClubPage() {
  const pretty = prettyDinnerDate(NEXT_DINNER_DATE);

  return (
    <div className="min-h-screen bg-[#FFFBF7] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <header className="mb-10 text-center">
          <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-3 block">
            Tampa Pulse
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Dinner Club 🍽️
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-lg mx-auto">
            Six Tampa Bay locals. One table. A restaurant you find out the morning of.
          </p>
          <p className="text-pulse-orange text-sm font-semibold mt-4">Next dinner: {pretty}</p>
        </header>

        <hr className="border-gray-200 mb-10" />

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">How it works</h2>
          <div className="space-y-5">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 items-start">
                <span className="shrink-0 w-8 h-8 rounded-full bg-pulse-orange text-white font-bold text-sm flex items-center justify-center">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px] mb-1">{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 bg-orange-50 rounded-2xl p-6">
          <h2 className="font-heading text-lg font-bold text-gray-900 mb-3">The honest details</h2>
          <ul className="space-y-2.5">
            {[
              "Free to join. You pay for your own dinner, same as any night out.",
              "Everyone at your table is a stranger. That is the point.",
              "21 and up. Tables are seated six people including you.",
              "If your plans change, reply to your confirmation so we can free the seat.",
            ].map((t, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="text-pulse-orange mt-1.5 shrink-0 text-xs">&bull;</span>
                <span className="text-gray-600 text-sm leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Save your seat</h2>
          <DinnerClubForm />
        </section>
      </div>
    </div>
  );
}
