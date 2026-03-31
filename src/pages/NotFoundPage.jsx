import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center px-4">
        {/* Glitchy 404 */}
        <motion.div
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="font-display text-[120px] font-bold leading-none bg-gradient-to-br from-brand-400 via-brand-500 to-purple-500 bg-clip-text text-transparent mb-4 select-none"
        >
          404
        </motion.div>

        <div className="w-12 h-12 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
          <Zap size={22} className="text-brand-400" />
        </div>

        <h2 className="font-display text-2xl font-bold text-white mb-2">Page not found</h2>
        <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex items-center gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft size={15} /> Go back
          </button>
          <button onClick={() => navigate("/")} className="btn-primary">
            <Home size={15} /> Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
