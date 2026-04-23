"use client";

import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/components/motion";
import type { Insight, InsightSeverity } from "@/lib/services/insightsService";
import { Skeleton } from "@/components/ui/skeleton";

const severityStyles: Record<InsightSeverity, string> = {
  critical: "border-red-500/40 bg-red-500/10 text-red-400",
  warning:  "border-amber-400/40 bg-amber-500/10 text-amber-400",
  positive: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  info:     "border-blue-500/30 bg-blue-500/8 text-blue-400",
};

const badgeStyles: Record<InsightSeverity, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  warning:  "bg-amber-500/20 text-amber-400 border-amber-400/30",
  positive: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  info:     "bg-blue-500/15 text-blue-400 border-blue-400/30",
};

const badgeLabel: Record<InsightSeverity, string> = {
  critical: "Urgent",
  warning:  "Attention",
  positive: "Great",
  info:     "Info",
};

interface InsightsPanelProps {
  insights: Insight[];
  loading?: boolean;
}

export function InsightsPanel({ insights, loading }: InsightsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-secondary/20 p-6 text-center text-muted-foreground text-sm">
        <p className="text-2xl mb-2">🔍</p>
        <p>No insights yet. Add products and make some sales to see AI-powered analysis here.</p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {insights.map((insight) => (
        <motion.div
          key={insight.id}
          variants={fadeUp}
          className={`rounded-xl border p-4 flex items-start gap-3 transition-all duration-200 hover:scale-[1.01] ${severityStyles[insight.severity]}`}
        >
          <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-semibold text-sm">{insight.title}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyles[insight.severity]}`}>
                {badgeLabel[insight.severity]}
              </span>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">{insight.description}</p>
          </div>
          {insight.value && (
            <div className="shrink-0 text-right">
              <span className="text-lg font-black" style={{ fontFamily: "Syne, sans-serif" }}>
                {insight.value}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
