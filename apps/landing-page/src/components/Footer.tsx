import { categories, coreModules, commerceModules, operationsModules, intelligenceModules } from "@/data/modules";
import { config } from "@/lib/config";

export default function Footer() {
  const categoryGroups = [
    { cat: categories.core, mods: coreModules },
    { cat: categories.commerce, mods: commerceModules },
    { cat: categories.operations, mods: operationsModules },
    { cat: categories.intelligence, mods: intelligenceModules },
  ];

  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="max-w-[1400px] mx-auto px-5 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          <div className="lg:col-span-3">
            <div className="mb-4">
              <span className="font-semibold text-[15px] tracking-[-0.02em] text-text-primary">L-ERP</span>
            </div>
            <p className="text-[12px] text-text-tertiary leading-[1.7] max-w-[240px] mb-4">
              Nền tảng ERP mã nguồn mở cho doanh nghiệp Việt Nam. 14 modules, MIT License.
            </p>
            <div className="flex gap-2 mt-4">
              <a href={config.social.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center bg-bg-tertiary hover:bg-bg-elevated transition-colors text-[10px] text-text-tertiary font-medium" title="GitHub">GH</a>
              <a href={config.social.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center bg-bg-tertiary hover:bg-bg-elevated transition-colors text-[10px] text-text-tertiary font-medium" title="LinkedIn">in</a>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {categoryGroups.map(({ cat, mods }) => (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2" style={{ backgroundColor: cat.color }} />
                    <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">{cat.name}</h4>
                  </div>
                  <ul className="space-y-2">
                    {mods.map((mod) => (
                      <li key={mod.id}>
                        <span className="text-[13px] text-text-secondary leading-relaxed hover:text-text-primary transition-colors cursor-default">{mod.shortName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border mb-8" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-3">Resources</h4>
            <ul className="space-y-2">
              {[
                { label: "GitHub", href: config.social.github },
                { label: "Documentation", href: `${config.social.github}#readme` },
                { label: "Contributing", href: `${config.social.github}/blob/main/CONTRIBUTING.md` },
                { label: "Changelog", href: `${config.social.github}/blob/main/CHANGELOG.md` },
              ].map((link) => (
                <li key={link.label}><a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-text-secondary leading-relaxed hover:text-text-primary transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-3">Community</h4>
            <ul className="space-y-2">
              {[
                { label: "Issues", href: `${config.social.github}/issues` },
                { label: "Discussions", href: `${config.social.github}/discussions` },
                { label: "Pull Requests", href: `${config.social.github}/pulls` },
              ].map((link) => (
                <li key={link.label}><a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-text-secondary leading-relaxed hover:text-text-primary transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-3">Tech Stack</h4>
            <ul className="space-y-2">
              {["Next.js 14", "TypeScript 5", "PostgreSQL 16", "Prisma ORM", "Tailwind CSS", "Docker + K8s"].map((t) => (
                <li key={t}><span className="text-[13px] text-text-secondary leading-relaxed">{t}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-3">Contact</h4>
            <ul className="space-y-2">
              <li><a href={`mailto:${config.email.hello}`} className="text-[13px] text-text-secondary leading-relaxed hover:text-text-primary transition-colors">{config.email.hello}</a></li>
              <li><span className="text-[13px] text-text-secondary leading-relaxed">MIT License</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-text-tertiary uppercase tracking-[0.1em]">VIET-ERP 2026</p>
          <p className="text-[10px] text-text-tertiary/50 tracking-[0.02em]">
            Built with <a href="mailto:lam.nguyen@lerp.dev" className="hover:text-text-tertiary transition-colors">Vibecode Kit</a> + RRI
          </p>
        </div>
      </div>
    </footer>
  );
}
