import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, CheckSquare, FolderOpen, Building2, ArrowRight, Clock, X } from "lucide-react";
import api from "../../utils/api";
import { useDebounce } from "../../hooks";
import { PriorityBadge, StatusBadge } from "./UIComponents";

const SECTIONS = [
  { key: "tasks",    icon: CheckSquare, label: "Tasks",    route: "/tasks"   },
  { key: "projects", icon: FolderOpen,  label: "Projects", route: "/projects" },
  { key: "vendors",  icon: Building2,   label: "Vendors",  route: "/vendors"  },
];

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ tasks: [], projects: [], vendors: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debounced = useDebounce(query, 280);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
      setResults({ tasks: [], projects: [], vendors: [] });
      setSelected(0);
    }
  }, [isOpen]);

  // Search API
  useEffect(() => {
    if (!debounced.trim()) { setResults({ tasks: [], projects: [], vendors: [] }); return; }
    setLoading(true);
    Promise.all([
      api.get(`/tasks?search=${encodeURIComponent(debounced)}`).catch(() => ({ data: { tasks: [] } })),
      api.get(`/projects?search=${encodeURIComponent(debounced)}`).catch(() => ({ data: { projects: [] } })),
      api.get(`/vendors?search=${encodeURIComponent(debounced)}`).catch(() => ({ data: { vendors: [] } })),
    ]).then(([t, p, v]) => {
      setResults({
        tasks:    t.data.tasks?.slice(0, 4)    || [],
        projects: p.data.projects?.slice(0, 3) || [],
        vendors:  v.data.vendors?.slice(0, 3)  || [],
      });
    }).finally(() => setLoading(false));
  }, [debounced]);

  // Flat list for keyboard nav
  const flat = [
    ...results.tasks.map((r)    => ({ ...r, _type: "tasks"    })),
    ...results.projects.map((r) => ({ ...r, _type: "projects" })),
    ...results.vendors.map((r)  => ({ ...r, _type: "vendors"  })),
  ];

  const handleSelect = (item) => {
    onClose();
    navigate(`/${item._type}`);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, flat.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && flat[selected]) handleSelect(flat[selected]);
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, flat, selected]);

  const hasResults = flat.length > 0;
  let flatIdx = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: -16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: -16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 w-full max-w-xl bg-surface-50 border border-white/[0.1] rounded-2xl shadow-[0_32px_100px_rgba(0,0,0,0.7)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-500 flex-shrink-0" />
                : <Search size={16} className="text-white/30 flex-shrink-0" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Search tasks, projects, vendors…"
                className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-white/20 hover:text-white/60 transition-colors">
                  <X size={14} />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[11px] text-white/30 font-mono">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto">
              {!query && (
                <div className="px-4 py-8 text-center">
                  <Search size={28} className="text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-white/25">Start typing to search everything</p>
                </div>
              )}

              {query && !loading && !hasResults && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-white/30">No results for <span className="text-white/50">"{query}"</span></p>
                </div>
              )}

              {SECTIONS.map(({ key, icon: Icon, label }) => {
                const items = results[key];
                if (!items?.length) return null;
                return (
                  <div key={key} className="py-2">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <Icon size={12} className="text-white/25" />
                      <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">{label}</span>
                    </div>
                    {items.map((item) => {
                      const idx = flatIdx++;
                      const isActive = idx === selected;
                      return (
                        <motion.button
                          key={item._id}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? "bg-brand-500/15" : "hover:bg-white/[0.04]"}`}
                          onClick={() => handleSelect({ ...item, _type: key })}
                          onMouseEnter={() => setSelected(idx)}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-brand-500/30" : "bg-white/[0.05]"}`}>
                            <Icon size={13} className={isActive ? "text-brand-300" : "text-white/30"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {item.title || item.name || item.vendorName}
                            </p>
                            <p className="text-xs text-white/30 truncate">
                              {key === "tasks"    && item.project?.name}
                              {key === "projects" && item.clientName}
                              {key === "vendors"  && item.project?.name}
                            </p>
                          </div>
                          {key === "tasks" && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <PriorityBadge priority={item.priority} />
                              <StatusBadge status={item.status} />
                            </div>
                          )}
                          {key === "projects" && <StatusBadge status={item.status} />}
                          {isActive && <ArrowRight size={13} className="text-brand-400 flex-shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center gap-4 text-[11px] text-white/20">
              <span className="flex items-center gap-1"><kbd className="px-1 bg-white/[0.06] rounded border border-white/[0.08] font-mono">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 bg-white/[0.06] rounded border border-white/[0.08] font-mono">↵</kbd> open</span>
              <span className="flex items-center gap-1"><kbd className="px-1 bg-white/[0.06] rounded border border-white/[0.08] font-mono">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
