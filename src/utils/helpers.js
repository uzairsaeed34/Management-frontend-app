import { format, formatDistanceToNow, isAfter } from "date-fns";

export const formatDate = (date, fmt = "MMM d, yyyy") => {
  if (!date) return "—";
  try { return format(new Date(date), fmt); } catch { return "—"; }
};

export const timeAgo = (date) => {
  if (!date) return "—";
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return "—"; }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === "completed") return false;
  return isAfter(new Date(), new Date(dueDate));
};

export const minutesToHours = (minutes) => {
  if (!minutes || minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const getPriorityColor = (priority) => {
  const map = { high: "#ff4d6d", medium: "#ffd166", low: "#06d6a0" };
  return map[priority] || "#8b90a7";
};

export const getStatusColor = (status) => {
  const map = {
    pending: "#8b90a7", in_progress: "#607fff", completed: "#06d6a0",
    active: "#3d5aff", on_hold: "#f77f00", open: "#ffd166", resolved: "#06d6a0",
  };
  return map[status] || "#8b90a7";
};

export const taskTypeLabels = {
  new_pe_work: "New PE Work",
  manual_validation: "Manual Validation",
  support: "Support",
  maintenance: "Maintenance",
  vendor_creation: "Vendor Creation",
  testing: "Testing",
  debugging: "Debugging",
  enhancement: "Enhancement",
};

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export const truncate = (str, len = 60) => {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
};
