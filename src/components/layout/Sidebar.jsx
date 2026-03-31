import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderOpen, CheckSquare, Kanban,
  Building2, MessageSquare, BarChart2, Users, Settings,
  ChevronLeft, ChevronRight, Zap, LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/helpers";
import api from "../../utils/api";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({ pendingTasks: 0 });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const load = () => {
      api.get("/dashboard").then(({ data }) => {
        const d = data.dashboard;
        setCounts({ pendingTasks: (d.tasks?.byStatus?.pending || 0) + (d.tasks?.byStatus?.in_progress || 0) });
      }).catch(() => {});
    };
    load();
  }, []);

  const navItems = [
    { to: "/",             icon: LayoutDashboard, label: "Dashboard"    },
    { to: "/projects",     icon: FolderOpen,      label: "Projects"     },
    { to: "/tasks",        icon: CheckSquare,     label: "Tasks",        badge: counts.pendingTasks || null },
    { to: "/board",        icon: Kanban,          label: "Board"        },
    { to: "/vendors",      icon: Building2,       label: "Vendors"      },
    { to: "/support-logs", icon: MessageSquare,   label: "Support Logs" },
    { to: "/workload-dashboard", icon: BarChart2, label: "Workload" },
    { to: "/admin-workload", icon: Users, label: "Admin Workload" },
    { to: "/reports",      icon: BarChart2,       label: "Reports"      },
  ];

  const adminItems = [
    { to: "/users",    icon: Users,    label: "Users"    },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = () => {
    if (logoutConfirm) { logout(); }
    else { setLogoutConfirm(true); setTimeout(() => setLogoutConfirm(false), 3000); }
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="flex flex-col h-screen bg-surface-50 border-r border-white/[0.07] relative z-20 flex-shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow">
            <Zap size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} className="overflow-hidden">
                <span className="font-display text-base font-bold text-white whitespace-nowrap">PE Manager</span>
                <p className="text-[10px] text-white/25 font-medium -mt-0.5">Prompt Engineer Workspace</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white transition-colors flex-shrink-0 ml-1">
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className={isActive ? "nav-item-active" : "nav-item"} title={collapsed ? label : ""}>
              <div className="relative flex-shrink-0">
                <Icon size={17} />
                {badge && badge > 0 && (
                  <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </motion.span>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }} exit={{ opacity:0, width:0 }}
                    className="overflow-hidden flex-1 flex items-center justify-between min-w-0">
                    <span className="text-sm whitespace-nowrap">{label}</span>
                    {badge && badge > 0 && (
                      <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 bg-brand-500/25 text-brand-300 rounded-md text-[10px] font-bold">{badge}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 mx-1 border-t border-white/[0.05]" />
            {!collapsed && <p className="px-3 pb-1 text-[10px] font-semibold text-white/20 uppercase tracking-widest">Admin</p>}
            {adminItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname.startsWith(to);
              return (
                <NavLink key={to} to={to} className={isActive ? "nav-item-active" : "nav-item"} title={collapsed ? label : ""}>
                  <Icon size={17} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }} exit={{ opacity:0, width:0 }}
                        className="overflow-hidden whitespace-nowrap text-sm">{label}</motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-white/[0.07] flex-shrink-0 space-y-1">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-brand-500/30 border border-brand-500/40 flex items-center justify-center text-brand-300 text-xs font-bold flex-shrink-0 font-display">
            {getInitials(user?.name)}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }} exit={{ opacity:0, width:0 }} className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</p>
                <p className="text-[10px] text-white/35 capitalize">{user?.role === "admin" ? "Team Lead" : "Prompt Engineer"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={handleLogout} title={collapsed ? "Logout" : ""}
          className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-sm transition-all duration-200 ${
            logoutConfirm ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-white/30 hover:text-white/70 hover:bg-white/[0.05]"
          }`}>
          <LogOut size={15} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:"auto" }} exit={{ opacity:0, width:0 }}
                className="overflow-hidden whitespace-nowrap text-xs font-medium">
                {logoutConfirm ? "Click again to confirm" : "Sign out"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
