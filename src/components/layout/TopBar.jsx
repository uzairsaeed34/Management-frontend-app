import React, { useState } from "react";
import { Search, Bell, Plus, Command } from "lucide-react";
import { motion } from "framer-motion";
import GlobalSearch from "../shared/GlobalSearch";

export default function TopBar({ title, onNewClick, newLabel }) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K / Ctrl+K opens global search
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-white/[0.07] bg-surface/80 glass flex items-center gap-4 px-6 flex-shrink-0 sticky top-0 z-10">
        <h1 className="font-display text-lg font-bold text-white flex-1 min-w-0 truncate">{title}</h1>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all text-sm text-white/30 hover:text-white/60 w-48 group"
        >
          <Search size={13} className="flex-shrink-0" />
          <span className="flex-1 text-left text-xs">Search…</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[10px] font-mono text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0">
            <Command size={9} />K
          </kbd>
        </button>

        {/* New Item CTA */}
        {onNewClick && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewClick}
            className="btn-primary"
          >
            <Plus size={15} />
            {newLabel || "New"}
          </motion.button>
        )}
      </header>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
