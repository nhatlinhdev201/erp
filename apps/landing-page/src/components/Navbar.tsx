"use client";

import { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { modules } from "@/data/modules";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(8, 9, 10, 0.7)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 h-[60px] flex items-center justify-between">
        <a href="/" className="flex items-center">
          <span className="font-extrabold text-[16px] tracking-[-0.02em] lerp-logo"><span className="viet-text">Việt</span><span className="erp-text"><span className="erp-e">E</span><span className="erp-r">R</span><span className="erp-p">P</span></span></span>
        </a>

        <div className="hidden md:flex items-center gap-7">
          <div
            className="relative"
            onMouseEnter={() => setModuleOpen(true)}
            onMouseLeave={() => setModuleOpen(false)}
          >
            <button className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-200">
              Modules
              <ChevronDown size={14} className={`transition-transform duration-200 ${moduleOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {moduleOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-[280px] p-2 overflow-hidden"
                  style={{
                    background: "rgba(15, 16, 17, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {modules.map((mod) => {
                    const IconComponent = mod.icon;
                    return (
                      <a
                        key={mod.id}
                        href={`#module-${mod.id}`}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-8 h-8 flex items-center justify-center mt-0.5" style={{ backgroundColor: `${mod.color}15` }}>
                          <IconComponent size={16} style={{ color: mod.color }} />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-text-primary">{mod.shortName}</div>
                          <div className="text-[11px] text-text-tertiary mt-0.5">{mod.tagline}</div>
                        </div>
                      </a>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="#features" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-200">Tính năng</a>
          <a href="#customers" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-200">Khách hàng</a>
          <a href="https://github.com/linkk/Viet-ERP" target="_blank" rel="noopener noreferrer" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-200">GitHub</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="https://github.com/linkk/Viet-ERP" target="_blank" rel="noopener noreferrer" className="text-[13px] sharp-button px-4 py-[7px] font-medium">
            Fork miễn phí
          </a>
        </div>

        <button className="md:hidden text-text-primary p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border"
            style={{ background: "rgba(8, 9, 10, 0.95)" }}
          >
            <div className="px-6 py-5 flex flex-col gap-2">
              <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-2">Modules</div>
              {modules.slice(0, 8).map((mod) => (
                <a key={mod.id} href={`#module-${mod.id}`} className="flex items-center gap-3 py-2.5 text-[15px] text-text-secondary hover:text-text-primary min-h-[44px]" onClick={() => setMobileOpen(false)}>
                  <div className="w-5 h-5 flex items-center justify-center" style={{ backgroundColor: `${mod.color}15` }}>
                    <mod.icon size={12} style={{ color: mod.color }} />
                  </div>
                  {mod.shortName}
                </a>
              ))}
              <div className="border-t border-border mt-3 pt-3">
                <a href="#features" className="block py-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Tính năng</a>
                <a href="#customers" className="block py-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Khách hàng</a>
              </div>
              <a href="https://github.com/linkk/Viet-ERP" target="_blank" rel="noopener noreferrer" className="mt-3 text-[13px] sharp-button px-4 py-2.5 text-center font-medium">
                Fork miễn phí trên GitHub
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
