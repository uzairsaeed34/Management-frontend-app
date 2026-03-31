import React from "react";
import { motion } from "framer-motion";
import { getInitials, getPriorityColor, getStatusColor, taskTypeLabels } from "../../utils/helpers";

// ── Priority Badge ─────────────────────────────────────────────
export const PriorityBadge = ({ priority }) => {
  const cls = {
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
  }[priority] || "badge bg-white/[0.06] text-white/50";
  const dot = { high: "bg-red-400", medium: "bg-yellow-400", low: "bg-green-400" }[priority];
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
};

// ── Status Badge ───────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const cls = {
    pending: "status-pending",
    in_progress: "status-in_progress",
    completed: "status-completed",
    active: "status-active",
    on_hold: "status-on_hold",
    open: "badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
    resolved: "badge bg-green-500/15 text-green-400 border border-green-500/20",
  }[status] || "status-pending";
  const label = {
    in_progress: "In Progress", on_hold: "On Hold",
  }[status] || status?.charAt(0).toUpperCase() + status?.slice(1);
  return <span className={cls}>{label}</span>;
};

// ── Task Type Badge ────────────────────────────────────────────
export const TaskTypeBadge = ({ type }) => (
  <span className="badge bg-purple-500/10 text-purple-300 border border-purple-500/20">
    {taskTypeLabels[type] || type}
  </span>
);

// ── Avatar ─────────────────────────────────────────────────────
export const Avatar = ({ name, size = "md", className = "" }) => {
  const sizes = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  return (
    <div className={`${sizes[size]} rounded-lg bg-brand-500/25 border border-brand-500/30 
      flex items-center justify-center font-bold text-brand-300 font-display flex-shrink-0 ${className}`}>
      {getInitials(name)}
    </div>
  );
};

// ── Progress Bar ───────────────────────────────────────────────
export const ProgressBar = ({ value = 0, color = "#3d5aff", className = "" }) => (
  <div className={`progress-bar ${className}`}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, value)}%` }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="progress-fill"
      style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
    />
  </div>
);

// ── Spinner ────────────────────────────────────────────────────
export const Spinner = ({ size = 20 }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
    style={{ width: size, height: size }}
    className="rounded-full border-2 border-brand-500/20 border-t-brand-500 flex-shrink-0"
  />
);

// ── Loading Screen ─────────────────────────────────────────────
export const LoadingScreen = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Spinner size={32} />
      <p className="text-sm text-white/40">Loading...</p>
    </div>
  </div>
);

// ── Empty State ────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
      {Icon && <Icon size={28} className="text-white/20" />}
    </div>
    <h3 className="text-base font-semibold text-white/60 mb-1">{title}</h3>
    {description && <p className="text-sm text-white/30 max-w-xs mb-4">{description}</p>}
    {action}
  </motion.div>
);

// ── Stat Card ──────────────────────────────────────────────────
export const StatCard = ({ title, value, icon: Icon, color = "#3d5aff", change, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-5 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{title}</span>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        {Icon && <Icon size={16} style={{ color }} />}
      </div>
    </div>
    <div>
      <div className="stat-value">{value ?? "—"}</div>
      {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
    </div>
    {change !== undefined && (
      <div className={`text-xs font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
        {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs last week
      </div>
    )}
  </motion.div>
);

// ── Modal Wrapper ──────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, width = "max-w-lg" }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`relative z-10 w-full ${width} bg-surface-50 border border-white/[0.09] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
            <h2 className="section-title">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </motion.div>
  );
};

// ── Select Input ───────────────────────────────────────────────
export const Select = ({ label, value, onChange, options, placeholder, required, className = "" }) => (
  <div className={className}>
    {label && <label className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input appearance-none cursor-pointer"
      required={required}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(({ value: v, label: l }) => (
        <option key={v} value={v} className="bg-surface-50">{l}</option>
      ))}
    </select>
  </div>
);

// ── Text Input ─────────────────────────────────────────────────
export const Input = ({ label, required, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>}
    <input className="input" required={required} {...props} />
  </div>
);

// ── Textarea ───────────────────────────────────────────────────
export const Textarea = ({ label, required, rows = 3, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>}
    <textarea className="input resize-none" rows={rows} required={required} {...props} />
  </div>
);
