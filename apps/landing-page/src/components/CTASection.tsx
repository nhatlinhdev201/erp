"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Mail } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import CircuitBackground from "./CircuitBackground";

export default function CTASection() {
  return (
    <section className="py-[80px] md:py-[140px] relative overflow-hidden">
      <CircuitBackground variant="cta" className="opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(139,92,246,0.08),transparent)]" />

      <div className="relative max-w-[1400px] mx-auto px-5 md:px-6 lg:px-8 z-10">
        <ScrollReveal className="text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-[11px] text-white/60 tracking-[0.15em] uppercase mb-5 font-medium">Start Building Today</p>
            <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.1] mb-6">
              <span className="gradient-text">Fork. Customize. Deploy.</span><br />
              <span className="text-text-tertiary">16 modules cho doanh nghiệp của bạn.</span>
            </h2>
            <p className="text-[16px] md:text-[18px] text-text-secondary max-w-2xl mx-auto mb-10 leading-[1.7]">
              Mã nguồn mở, MIT License. Fork về, thay branding, deploy lên cloud.<br />
              1.4 triệu dòng mã, 16 modules, 980 Prisma models — sẵn sàng production.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a href="https://github.com/linkk/Viet-ERP" target="_blank" rel="noopener noreferrer" className="sharp-button px-8 py-4 text-[15px] font-medium flex items-center gap-2">
                Fork trên GitHub <ArrowRight size={16} />
              </a>
              <a href="https://github.com/linkk/Viet-ERP/issues" target="_blank" rel="noopener noreferrer" className="px-8 py-4 text-[15px] text-text-secondary hover:text-text-primary border border-border hover:border-border-hover transition-all flex items-center gap-2">
                <MessageCircle size={16} /> Report Issues
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[13px] text-text-tertiary">
              <a href="mailto:lam.nguyen@lerp.dev" className="flex items-center gap-2 hover:text-text-secondary transition-colors">
                <Mail size={14} /> lam.nguyen@lerp.dev
              </a>
              <span className="hidden sm:block text-border">|</span>
              <span>MIT License | 100% Open Source</span>
            </div>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={0.3} className="mt-16">
          <div className="flex flex-wrap items-center justify-center gap-8 text-text-tertiary">
            {[
              { label: "TypeScript", icon: "TS" },
              { label: "Next.js 14", icon: "NX" },
              { label: "PostgreSQL", icon: "PG" },
              { label: "Prisma ORM", icon: "PR" },
              { label: "Tailwind CSS", icon: "TW" },
              { label: "Docker + K8s", icon: "DK" },
            ].map((tech) => (
              <div key={tech.label} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-bg-tertiary text-[8px] font-bold text-text-secondary">{tech.icon}</span>
                <span className="text-[12px]">{tech.label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
