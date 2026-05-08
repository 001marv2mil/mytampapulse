import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

interface AdminPageProps {
  searchParams: Promise<{ secret?: string }>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max, color = "#FF5A36" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-gray-500 w-32 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">{value}</span>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { secret } = await searchParams;

  if (!secret || secret !== process.env.CRON_SECRET) {
    redirect("/");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalActive },
    { count: new7d },
    { count: new30d },
    { count: totalUnsub },
    { data: shareEvents },
    { count: totalReferrals },
    { data: topReferrers },
    { data: recentSubs },
    { data: sends },
  ] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active").gte("created_at", sevenDaysAgo),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active").gte("created_at", thirtyDaysAgo),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
    supabase.from("share_events").select("share_method, share_cta, issue_number, created_at, subscriber_id").order("created_at", { ascending: false }),
    supabase.from("referrals").select("*", { count: "exact", head: true }),
    supabase.from("subscribers").select("email, referral_count").gt("referral_count", 0).order("referral_count", { ascending: false }).limit(10),
    supabase.from("subscribers").select("email, created_at, referral_count").eq("status", "active").order("created_at", { ascending: false }).limit(10),
    supabase.from("newsletter_sends").select("issue_number").order("issue_number", { ascending: false }).limit(1),
  ]);

  // Aggregate shares
  const byMethod: Record<string, number> = {};
  const byCta: Record<string, number> = {};
  const byIssue: Record<string, number> = {};

  for (const e of (shareEvents ?? [])) {
    byMethod[e.share_method] = (byMethod[e.share_method] ?? 0) + 1;
    if (e.share_cta) byCta[e.share_cta] = (byCta[e.share_cta] ?? 0) + 1;
    const key = `Issue ${e.issue_number}`;
    byIssue[key] = (byIssue[key] ?? 0) + 1;
  }

  const totalShares = (shareEvents ?? []).length;
  const maxMethod = Math.max(1, ...Object.values(byMethod));
  const maxCta = Math.max(1, ...Object.values(byCta));
  const maxIssue = Math.max(1, ...Object.values(byIssue));

  const latestIssue = sends?.[0]?.issue_number ?? "N/A";
  const retentionRate =
    (totalActive ?? 0) + (totalUnsub ?? 0) > 0
      ? Math.round(((totalActive ?? 0) / ((totalActive ?? 0) + (totalUnsub ?? 0))) * 100)
      : 100;

  const now = new Date();
  const generated = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <div className="bg-gray-900 text-white px-8 py-6 flex items-center justify-between">
        <div>
          <span className="text-xl font-black tracking-tight">
            tampa<span className="text-[#FF5A36]">pulse</span>
          </span>
          <span className="ml-3 text-gray-400 text-sm">Admin</span>
        </div>
        <p className="text-gray-500 text-xs">Updated {generated} EST</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Subscriber stats */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Subscribers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Active" value={totalActive ?? 0} />
            <StatCard label="New This Week" value={new7d ?? 0} sub="last 7 days" />
            <StatCard label="New This Month" value={new30d ?? 0} sub="last 30 days" />
            <StatCard label="Retention" value={`${retentionRate}%`} sub={`${totalUnsub ?? 0} unsubs total`} />
          </div>
        </section>

        {/* Share analytics */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Sharing Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* By method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">By Method</p>
              {totalShares === 0 ? (
                <p className="text-gray-400 text-sm">No shares yet.</p>
              ) : (
                Object.entries(byMethod)
                  .sort((a, b) => b[1] - a[1])
                  .map(([method, count]) => (
                    <Bar key={method} label={method.replace(/_/g, " ")} value={count} max={maxMethod} />
                  ))
              )}
              <p className="text-xs text-gray-400 mt-4">{totalShares} total share events</p>
            </div>

            {/* By CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">By CTA Location</p>
              {Object.keys(byCta).length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet.</p>
              ) : (
                Object.entries(byCta)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cta, count]) => (
                    <Bar key={cta} label={cta.replace(/_/g, " ")} value={count} max={maxCta} color="#6366f1" />
                  ))
              )}
            </div>

            {/* By issue */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">By Issue</p>
              {Object.keys(byIssue).length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet.</p>
              ) : (
                Object.entries(byIssue)
                  .sort((a, b) => b[1] - a[1])
                  .map(([issue, count]) => (
                    <Bar key={issue} label={issue} value={count} max={maxIssue} color="#10b981" />
                  ))
              )}
            </div>
          </div>
        </section>

        {/* Referrals */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Referrals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Referral Conversions</p>
              <p className="text-3xl font-bold text-gray-900">{totalReferrals ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                people who subscribed via a referral link
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Top Referrers</p>
              {(topReferrers ?? []).length === 0 ? (
                <p className="text-gray-400 text-sm">None yet.</p>
              ) : (
                <div className="space-y-2">
                  {(topReferrers ?? []).map((r, i) => (
                    <div key={r.email} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate max-w-[200px]">
                        <span className="text-gray-400 text-xs mr-2">{i + 1}.</span>
                        {r.email}
                      </span>
                      <span className="text-xs font-bold text-[#FF5A36] shrink-0 ml-2">
                        {r.referral_count} ref{r.referral_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent share events */}
        {(shareEvents ?? []).length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Recent Share Events</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wide">When</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wide">Method</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wide">CTA</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wide">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {(shareEvents ?? []).slice(0, 25).map((e, i) => {
                    const ts = new Date(e.created_at).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      dateStyle: "short",
                      timeStyle: "short",
                    });
                    return (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 px-5 text-gray-500">{ts}</td>
                        <td className="py-3 px-5">
                          <span className="inline-block bg-orange-50 text-[#FF5A36] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {e.share_method?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-gray-400 text-xs">{e.share_cta?.replace(/_/g, " ") || "—"}</td>
                        <td className="py-3 px-5 text-gray-500">#{e.issue_number}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Recent subscribers */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Recent Subscribers</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wide">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {(recentSubs ?? []).map((s, i) => {
                  const joined = new Date(s.created_at).toLocaleDateString("en-US", {
                    timeZone: "America/New_York",
                    dateStyle: "medium",
                  });
                  return (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 px-5 text-gray-700">{s.email}</td>
                      <td className="py-3 px-5 text-gray-400 text-xs">{joined}</td>
                      <td className="py-3 px-5">
                        {(s.referral_count ?? 0) > 0 ? (
                          <span className="text-[#FF5A36] font-semibold text-xs">{s.referral_count}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-gray-300 text-center pb-4">
          Tampa Pulse Admin &middot; Latest issue sent: #{latestIssue}
        </p>
      </div>
    </div>
  );
}
