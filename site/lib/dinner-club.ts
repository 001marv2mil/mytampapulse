// Tampa Pulse Dinner Club — shared config.
// Update NEXT_DINNER_DATE when a new dinner is announced. Both the landing page
// and the signup route read from here so they can never drift apart.

export const NEXT_DINNER_DATE = "2026-08-20";

export function prettyDinnerDate(date: string = NEXT_DINNER_DATE): string {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
