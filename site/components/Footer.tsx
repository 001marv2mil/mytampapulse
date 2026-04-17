import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-pulse-orange flex items-center justify-center text-white text-xs font-black">T</div>
              <span className="font-heading text-base font-bold text-gray-900">mytampapulse</span>
            </div>
            <span className="text-xs text-gray-400 leading-relaxed block">Tampa Bay&apos;s weekly cheat code. Every Thursday. 🌴</span>
          </div>

          {/* Readers */}
          <div>
            <p className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-3">Readers</p>
            <div className="space-y-2">
              <Link href="/#subscribe" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Subscribe Free</Link>
              <Link href="/newsletter" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">This Week&apos;s Issue</Link>
              <Link href="/newsletter" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Archive</Link>
            </div>
          </div>

          {/* Business */}
          <div>
            <p className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-3">Business</p>
            <div className="space-y-2">
              <Link href="/advertise" className="block text-sm text-pulse-orange font-semibold hover:text-pulse-orange-hover transition-colors">Advertise With Us</Link>
              <a href="https://instagram.com/mytampapulse" target="_blank" rel="noopener noreferrer"
                className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Instagram</a>
              <Link href="/pulse-plus" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Pulse+ (Coming Soon)</Link>
            </div>
          </div>

          {/* Revenue callout */}
          <div>
            <p className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-3">Partner With Us</p>
            <p className="text-gray-400 text-xs leading-relaxed mb-3">Reach 1,000+ engaged Tampa locals. Sponsorships from $299/issue.</p>
            <Link href="/advertise"
              className="inline-flex items-center gap-1.5 bg-pulse-orange text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-pulse-orange-hover transition-colors">
              See Packages →
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-300">&copy; {new Date().getFullYear()} mytampapulse. All rights reserved.</p>
          <p className="text-xs text-gray-300">Tampa Bay, FL 🌴</p>
        </div>
      </div>
    </footer>
  );
}
