import React from "react";
import { motion } from "framer-motion";
import type { TelemetryData } from "../../types";

interface TelemetryDashboardProps {
  dataHistory: TelemetryData[];
}

function Sparkline({ data, color, maxValue }: { data: number[]; color: string; maxValue: number }) {
  if (data.length === 0) return <svg className="h-10 w-full" />;
  
  const min = 0;
  const max = Math.max(...data, maxValue);
  const range = max - min === 0 ? 1 : max - min;
  
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="h-10 w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        points={pts}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ dataHistory }) => {
  const current = dataHistory[dataHistory.length - 1] || {
    tick: 0,
    p50Ms: 0,
    p95Ms: 0,
    p99Ms: 0,
    errorRate: 0,
    memoryMb: 0,
    throughputRps: 0,
  };

  const p99History = dataHistory.map((d) => d.p99Ms);
  const rpsHistory = dataHistory.map((d) => d.throughputRps);

  const errorPct = (current.errorRate * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b chassis-plate">
      {/* P99 Latency */}
      <div className="bg-theme-surface p-4 border-r border-theme-ink flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="font-mono tabular-nums text-xs uppercase tracking-wider text-theme-ink">P99 LATENCY</span>
          <span className={`font-mono tabular-nums text-lg font-bold ${current.p99Ms > 800 ? "text-red-700" : "text-theme-ink"}`}>
            {current.p99Ms}ms
          </span>
        </div>
        <Sparkline data={p99History.slice(-50)} color={current.p99Ms > 800 ? "#b91c1c" : "#1D1F23"} maxValue={100} />
      </div>

      {/* Throughput */}
      <div className="bg-theme-surface p-4 border-r border-theme-ink flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="font-mono tabular-nums text-xs uppercase tracking-wider text-theme-ink">THROUGHPUT</span>
          <span className="font-mono tabular-nums text-lg font-bold text-theme-ink">
            {current.throughputRps} RPS
          </span>
        </div>
        <Sparkline data={rpsHistory.slice(-50)} color="#1D1F23" maxValue={5000} />
      </div>

      {/* Error Rate */}
      <div className="bg-theme-surface p-4 border-r border-theme-ink flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="font-mono tabular-nums text-xs uppercase tracking-wider text-theme-ink">ERROR RATE</span>
          <span className={`font-mono tabular-nums text-lg font-bold ${current.errorRate > 0 ? "text-red-700" : "text-theme-ink"}`}>
            {errorPct}%
          </span>
        </div>
        <div className="h-10 flex items-center">
           <div className="w-full bg-theme-base h-2">
              <div 
                className={`h-2 transition-all duration-300 ${current.errorRate > 0 ? "bg-red-700" : "bg-[#10B981]"}`} 
                style={{ width: `${Math.max(5, current.errorRate * 100)}%` }} 
              />
           </div>
        </div>
      </div>

      {/* Memory Footprint */}
      <div className="bg-theme-surface p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="font-mono tabular-nums text-xs uppercase tracking-wider text-theme-ink">MEMORY</span>
          <span className="font-mono tabular-nums text-lg font-bold text-theme-ink">
            {current.memoryMb} MB
          </span>
        </div>
        <div className="h-10 flex items-center">
           <div className="w-full bg-theme-base h-2">
              <div 
                className="bg-[#1D1F23] h-2 transition-all duration-300" 
                style={{ width: `${Math.min(100, (current.memoryMb / 1024) * 100)}%` }} 
              />
           </div>
        </div>
      </div>
    </div>
  );
};
