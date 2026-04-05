"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const PACKAGES = [
  {
    name: "Shoutout",
    price: "$299",
    per: "per issue",
    desc: "A natural, editorial mention woven into that week's picks. Reads like a recommendation, not an ad.",
    includes: [
      "1 mention in the weekly newsletter",
      "Your name, location, and one-liner",
      "Link to your website or Instagram",
      "Sent to 1,000+ Tampa subscribers",
    ],
    cta: "Book a Shoutout",
    highlight: false,
  },
  {
    name: "Featured Spot",
    price: "$599",
    per: "per issue",
    desc: "Your business gets the full Hidden Gem or Event Pick treatment — written in our voice, front and center.",
    includes: [
      "Dedicated feature section (150–200 words)",
      "Written in Pulse editorial voice",
      "Photo + full description",
      "Link + CTA button",
      "Promoted to 1,000+ engaged locals",
    ],
    cta: "Book a Feature",
    highlight: true,
    badge: "Most Booked",
  },
  {
    name: "Full Sponsor",
    price: "$999",
    per: "per issue",
    desc: "Exclusive ownership of one issue. Your brand is woven throughout — newsletter + Instagram + stories.",
    includes: [
      "Everything in Featured Spot",
      "\"Presented by [your brand]\" throughout issue",
      "1 Instagram feed post (@mytampapulse)",
      "2 Instagram stories",
      "Tagged + linked across all placements",
      "Monthly recaps of reach & engagement",
    ],
    cta: "Book Full Sponsor",
    highlight: false,
  },
];

const STATS = [
  { value: "1,000+", label: "Subscribers" },
  { value: "47%", label: "Avg Open Rate" },
  { value: "Tampa Bay", label: "Hyper-local audience" },
  { value: "Every Thursday", label: "Consistent delivery" },
];

export default function AdvertisePage() {
  const [form, setForm] = useState({ name: "", business: "", email: "", package: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    try {
      const res = await fetch("/api/sponsor-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7]">

      {/* Hero */}
      <section className="pt-32 pb-20 px-6" style={{ background: "linear-gradient(170deg, #FFF0E8 0%, #FFFBF7 60%)" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-6 shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-700 text-xs font-bold tracking-wider uppercase">Accepting Sponsors · Limited Spots</span>
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[1.0] tracking-tight mb-6">
              Get in front of<br />
              <span className="text-pulse-orange">Tampa&apos;s most</span><br />
              engaged locals.
            </h1>

            <p className="text-gray-500 text-lg max-w-xl leading-relaxed mb-10">
              mytampapulse reaches 1,000+ Tampa Bay locals who actively seek out the best events, restaurants, bars, and experiences. These aren&apos;t passive followers — they read every issue and actually go out.
            </p>

            <a href="#packages"
              className="inline-flex items-center gap-2 bg-pulse-orange hover:bg-pulse-orange-hover text-white font-black px-8 py-4 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-orange-200">
              See Sponsorship Packages
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
              <p className="font-heading font-black text-2xl text-gray-900">{s.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why it works */}
      <section className="py-20 px-6 bg-[#FFFBF7]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-12">
            <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">Why It Works</p>
            <h2 className="font-heading text-4xl font-black text-gray-900">Not an ad. A recommendation.</h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: "🎯", title: "Hyper-targeted", desc: "Every subscriber is a Tampa Bay local who opted in specifically for recommendations like yours." },
              { icon: "📖", title: "Editorial voice", desc: "We write about your business the same way we write about everything else — like a trusted friend, not a press release." },
              { icon: "🔁", title: "Action-oriented", desc: "Our subscribers don't just read — they go. They book, they show up, they spend. That's the whole point of the Pulse." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-orange-200 hover:shadow-md transition-all duration-200">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-heading font-black text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">Sponsorship Options</p>
            <h2 className="font-heading text-4xl font-black text-gray-900">Pick your placement</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">All packages include editorial write-up in our voice — no copy-pasting your press release.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {PACKAGES.map((pkg, i) => (
              <motion.div key={pkg.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl p-8 flex flex-col ${
                  pkg.highlight
                    ? "bg-gray-900 border border-gray-800"
                    : "bg-gray-50 border border-gray-200"
                }`}>

                {pkg.badge && (
                  <div className="absolute -top-3 left-6">
                    <span className="bg-pulse-orange text-white text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-full shadow">
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div className="mt-2 mb-6">
                  <h3 className={`font-heading text-xl font-black mb-1 ${pkg.highlight ? "text-white" : "text-gray-900"}`}>
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className={`font-heading text-4xl font-black ${pkg.highlight ? "text-white" : "text-gray-900"}`}>
                      {pkg.price}
                    </span>
                    <span className={`text-sm ${pkg.highlight ? "text-gray-400" : "text-gray-400"}`}>{pkg.per}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${pkg.highlight ? "text-gray-400" : "text-gray-500"}`}>
                    {pkg.desc}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${pkg.highlight ? "text-pulse-orange" : "text-gray-400"}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-xs leading-relaxed ${pkg.highlight ? "text-gray-300" : "text-gray-600"}`}>{item}</span>
                    </li>
                  ))}
                </ul>

                <a href="#contact"
                  className={`block w-full text-center font-black py-3.5 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] ${
                    pkg.highlight
                      ? "bg-pulse-orange hover:bg-pulse-orange-hover text-white shadow-lg shadow-orange-900/30"
                      : "bg-white border border-gray-300 hover:border-pulse-orange text-gray-900 hover:text-pulse-orange"
                  }`}>
                  {pkg.cta}
                </a>
              </motion.div>
            ))}
          </div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center text-gray-400 text-xs mt-8">
            Multi-issue discounts available. Instagram-only packages also available. DM us to discuss.
          </motion.p>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" className="py-20 px-6 bg-orange-50">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">Get Started</p>
            <h2 className="font-heading text-4xl font-black text-gray-900">Book a spot</h2>
            <p className="text-gray-500 text-sm mt-3">We&apos;ll get back to you within 24 hours to confirm availability and next steps.</p>
          </motion.div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-green-200 rounded-3xl p-10 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="font-heading font-black text-gray-900 text-2xl mb-2">We got it!</h3>
              <p className="text-gray-500 text-sm">We&apos;ll be in touch within 24 hours to lock in your spot.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-orange-100 rounded-3xl p-8 shadow-sm space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-700 text-xs font-bold block mb-1.5">Your Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Jane Smith"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-pulse-orange rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-gray-700 text-xs font-bold block mb-1.5">Business Name</label>
                  <input type="text" required value={form.business} onChange={e => setForm({...form, business: e.target.value})}
                    placeholder="Your Restaurant / Bar / Brand"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-pulse-orange rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-gray-700 text-xs font-bold block mb-1.5">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="you@yourbusiness.com"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-pulse-orange rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-gray-700 text-xs font-bold block mb-1.5">Package Interest</label>
                <select required value={form.package} onChange={e => setForm({...form, package: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-pulse-orange rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-colors">
                  <option value="">Select a package</option>
                  <option>Shoutout — $299/issue</option>
                  <option>Featured Spot — $599/issue</option>
                  <option>Full Sponsor — $999/issue</option>
                  <option>Not sure, let&apos;s talk</option>
                </select>
              </div>
              <div>
                <label className="text-gray-700 text-xs font-bold block mb-1.5">Tell us about your business</label>
                <textarea rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  placeholder="What do you do, where are you located, what's your goal?"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-pulse-orange rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none transition-colors resize-none" />
              </div>
              {submitError && <p className="text-red-500 text-xs text-center">{submitError}</p>}
              <button type="submit"
                className="w-full bg-pulse-orange hover:bg-pulse-orange-hover text-white font-black py-4 rounded-xl text-sm transition-all duration-200 hover:scale-[1.01] shadow-lg shadow-orange-200">
                Send Inquiry →
              </button>
              <p className="text-gray-400 text-xs text-center">We respond within 24 hours. No commitment required.</p>
            </form>
          )}
        </div>
      </section>

      <div className="py-10 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center">
        <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">← Back to home</Link>
      </div>

    </div>
  );
}
