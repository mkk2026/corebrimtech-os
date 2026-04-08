import { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  module: string;
  description: string;
  phase: string;
}

export default function ComingSoon({ icon: Icon, module, description, phase }: ComingSoonProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 mb-5">
          <Icon className="w-7 h-7 text-neutral-600" />
        </div>
        <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-2">{phase}</div>
        <h2 className="text-xl font-bold text-neutral-200 mb-2">{module}</h2>
        <p className="text-sm text-neutral-500 leading-relaxed mb-6">{description}</p>
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono text-neutral-500">Building next...</span>
        </div>
      </div>
    </div>
  );
}
