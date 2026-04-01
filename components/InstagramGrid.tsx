"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const posts = [
  { id: "1", img: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80", caption: "Friday night energy at Armature Works 🔥", likes: "1.2k", tag: "Events" },
  { id: "2", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80", caption: "The best new restaurant in Tampa? We think so 👀", likes: "987", tag: "Food" },
  { id: "3", img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80", caption: "Rooftop szn is officially here ☀️", likes: "2.1k", tag: "Nightlife" },
  { id: "4", img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80", caption: "Happy hour that hits different. Save this 🍹", likes: "756", tag: "Happy Hour" },
  { id: "5", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80", caption: "This hidden gem in Seminole Heights slaps 🌮", likes: "1.5k", tag: "Hidden Gem" },
  { id: "6", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", caption: "Weekend plans? We got you. Tap the link 📲", likes: "3.2k", tag: "Weekend" },
];

export default function InstagramGrid() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#FFFBF7]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase block mb-3">
              @mytampapulse
            </motion.span>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }} className="font-heading text-4xl md:text-5xl font-black text-gray-900">
              Latest Posts 📸
            </motion.h2>
          </div>
          <motion.a initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            href="https://instagram.com/mytampapulse" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-pulse-orange hover:text-white bg-orange-50 hover:bg-pulse-orange border border-orange-200 hover:border-pulse-orange px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            View All
          </motion.a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {posts.map((post, i) => (
            <motion.a key={post.id} href="https://instagram.com/mytampapulse" target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }} whileHover={{ scale: 1.02 }}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              <Image src={post.img} alt={post.caption} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-pulse-orange text-[10px] font-bold uppercase tracking-wider block mb-1">{post.tag}</span>
                <p className="text-white text-xs font-medium leading-tight line-clamp-2">{post.caption}</p>
                <p className="text-white/60 text-[10px] mt-1">❤️ {post.likes}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
