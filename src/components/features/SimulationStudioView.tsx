import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Play, Square, ShieldAlert, CheckCircle, ArrowLeft } from "lucide-react";
import type { SimulationSpec, TelemetryData, UserProfile } from "../../types";
import { TelemetryDashboard } from "../ui/TelemetryDashboard";
import { submitSimulationRun } from "../../services/api";

interface SimulationStudioViewProps {
  spec: SimulationSpec;
  user: UserProfile;
  onBack: () => void;
}

export const SimulationStudioView: React.FC<SimulationStudioViewProps> = ({ spec, user, onBack }) => {
  const [code, setCode] = useState(spec.initialCode || "// Write your patch here...\n\nfunction processRequest(db, req) {\n  // Implement logic\n}");
  const [isRunning, setIsRunning] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [rca, setRca] = useState("");
  const [tradeoffs, setTradeoffs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(new URL("../../lib/simulation/worker.ts", import.meta.url), { type: "module" });

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'TELEMETRY') {
        setTelemetryHistory(prev => [...prev, e.data.data]);
      } else if (e.data.type === 'COMPLETE') {
        setIsRunning(false);
        setIsComplete(true);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleStart = () => {
    setTelemetryHistory([]);
    setIsComplete(false);
    setIsRunning(true);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'START', code, seed: 'SEED_0x9B41' });
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'STOP' });
    }
  };

  const handleSubmitDefense = async () => {
    setIsSubmitting(true);
    const initialP99 = telemetryHistory[0]?.p99Ms || 0;
    const finalP99 = telemetryHistory[telemetryHistory.length - 1]?.p99Ms || 0;
    
    await submitSimulationRun({
      specId: spec.id,
      userId: user.id,
      initialP99Ms: initialP99,
      resolvedP99Ms: finalP99,
      simulatedSeed: 'SEED_0x9B41',
      timeToResolveSeconds: Math.round(telemetryHistory.length * 0.05), // approx
      postMortemRca: rca,
      postMortemTradeoffs: tradeoffs
    });
    
    setIsSubmitting(false);
    onBack(); // Return to previous screen
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-theme-ink">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b chassis-plate">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-theme-ink/60 hover:text-theme-ink transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-theme-ink">{spec.title}</h1>
            <p className="text-micro font-mono text-theme-ink/60 uppercase tracking-wider">{spec.track} · {spec.slug}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {!isRunning ? (
            <button 
              onClick={handleStart}
className="inline-flex items-center gap-2 px-4 py-2 tactile-btn-primary text-theme-base text-xs font-bold uppercase tracking-wider rounded-none "
            >
              <Play className="h-4 w-4" /> <span>RUN SIMULATION</span>
            </button>
          ) : (
            <button 
              onClick={handleStop}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-700 bg-red-700/10 text-red-700 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-red-700 hover:text-theme-base transition"
            >
              <Square className="h-4 w-4" /> <span>STOP</span>
            </button>
          )}
        </div>
      </header>

      {/* Telemetry Dashboard */}
      <TelemetryDashboard dataHistory={telemetryHistory} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor */}
        <div className="flex-1 relative border-r border-theme-ink">
          <Editor
            height="100%"
            language="typescript"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 16 },
              lineHeight: 1.6
            }}
          />
        </div>
        
        {/* Scenario Details / Post-Mortem Gate */}
        <div className="w-[400px] flex flex-col bg-theme-surface border-l border-theme-ink overflow-y-auto">
          {isComplete ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
              <div className="flex items-center gap-2 text-theme-ink mb-4 border-b border-theme-ink pb-2">
                <ShieldAlert className="h-5 w-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">INCIDENT POST-MORTEM GATE</h2>
              </div>
              <p className="text-xs text-theme-ink/80 mb-6 leading-relaxed uppercase tracking-wider font-sans">
                THE SIMULATION HAS CONCLUDED. TO SEAL THIS PROOF CREDENTIAL, YOU MUST DEFEND YOUR ARCHITECTURAL DECISIONS.
              </p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-theme-ink uppercase tracking-wider mb-2">ROOT CAUSE ANALYSIS (RCA)</label>
                  <textarea 
                    className="w-full h-32 recessed-meter rounded-none p-3 text-xs font-mono text-theme-ink focus:outline-none resize-none placeholder-[#1D1F23]/40"
                    placeholder="EXPLAIN THE TECHNICAL ROOT CAUSE OF THE INCIDENT..."
                    value={rca}
                    onChange={(e) => setRca(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-ink uppercase tracking-wider mb-2">TRADE-OFFS & ALTERNATIVES</label>
                  <textarea 
                    className="w-full h-32 recessed-meter rounded-none p-3 text-xs font-mono text-theme-ink focus:outline-none resize-none placeholder-[#1D1F23]/40"
                    placeholder="WHY DID YOU CHOOSE THIS SOLUTION OVER ALTERNATIVE APPROACHES? WHAT ARE THE EDGE CASE LIMITATIONS?"
                    value={tradeoffs}
                    onChange={(e) => setTradeoffs(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={handleSubmitDefense}
                  disabled={isSubmitting || rca.length < 20 || tradeoffs.length < 20}
className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 tactile-btn-primary text-theme-base text-xs font-bold uppercase tracking-wider rounded-none disabled:opacity-50 "
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isSubmitting ? "SUBMITTING..." : "SUBMIT INCIDENT REPORT"}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="p-6">
              <h3 className="text-micro font-bold uppercase tracking-wider text-theme-ink/60 mb-2 font-mono">INCIDENT SCENARIO</h3>
              <div className="font-sans text-xs">
                <p className="text-theme-ink leading-relaxed mb-6">{spec.incidentScenario}</p>
                
                <h4 className="text-micro font-bold uppercase tracking-wider text-theme-ink/60 mb-2 font-mono border-t border-theme-ink/20 pt-4">TARGET METRICS</h4>
                <ul className="space-y-1.5 text-theme-ink font-mono text-micro uppercase tracking-wider tabular-nums">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#1D1F23] rounded-none"></span>MAX P99 LATENCY: &lt; {spec.targetMetrics.max_p99_ms}MS</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#1D1F23] rounded-none"></span>MAX ERROR RATE: &lt; {spec.targetMetrics.max_error_rate * 100}%</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
