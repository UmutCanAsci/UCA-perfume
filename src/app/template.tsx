"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Cinematic Dual-Layered Golden Curtain Reveal */}
      {/* Layer 1: Dark gold base curtain */}
      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        style={{ originY: 1 }}
        className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#8e7355] to-[#3a2f22] pointer-events-none"
      />
      {/* Layer 2: Main bright gold curtain */}
      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.76, 0, 0.24, 1] }}
        style={{ originY: 1 }}
        className="fixed inset-0 z-[9998] bg-gradient-to-b from-[#e5cda8] via-[#c5a880] to-[#8e7355] pointer-events-none"
      />

      {/* Page Content Fade, Lift, and Scale-up */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </>
  );
}
