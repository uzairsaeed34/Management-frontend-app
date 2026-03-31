import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Lock, Loader2, CheckCircle2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { Input, Avatar } from "../components/shared/UIComponents";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../utils/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [tab, setTab] = useState("profile");

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put(`/users/${user._id}`, { name: profile.name, email: profile.email });
      toast("Profile updated", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update", "error");
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast("New passwords do not match", "error"); return;
    }
    if (passwords.newPassword.length < 6) {
      toast("Password must be at least 6 characters", "error"); return;
    }
    setSavingPass(true);
    try {
      await api.put("/auth/update-password", { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast("Password updated successfully", "success");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update password", "error");
    } finally { setSavingPass(false); }
  };

  const TABS = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "security", icon: Lock, label: "Security" },
  ];

  return (
    <AppLayout>
      <TopBar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Tab nav */}
          <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white"}`}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card p-6 space-y-6">
              <div>
                <h2 className="section-title mb-1">Profile</h2>
                <p className="text-sm text-white/40">Update your personal information</p>
              </div>
              {/* Avatar preview */}
              <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <Avatar name={user?.name} size="lg" />
                <div>
                  <p className="font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">{user?.email}</p>
                  <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium ${user?.role === "admin" ? "bg-purple-500/15 text-purple-400" : "bg-brand-500/15 text-brand-400"}`}>
                    {user?.role === "admin" ? "Admin" : "Prompt Engineer"}
                  </div>
                </div>
              </div>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <Input label="Full Name" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                <Input label="Email Address" required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-50">
                    {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {tab === "security" && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card p-6 space-y-6">
              <div>
                <h2 className="section-title mb-1">Security</h2>
                <p className="text-sm text-white/40">Change your account password</p>
              </div>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <Input label="Current Password" required type="password" placeholder="••••••••" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                <Input label="New Password" required type="password" placeholder="Min. 6 characters" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                <Input label="Confirm New Password" required type="password" placeholder="Repeat new password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={savingPass} className="btn-primary disabled:opacity-50">
                    {savingPass ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    {savingPass ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
              <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/15">
                <p className="text-xs text-white/40 leading-relaxed">
                  For security, you'll be asked to re-login after changing your password. Use a strong password with at least 8 characters including numbers and symbols.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
