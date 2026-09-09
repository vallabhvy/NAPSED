import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Terminal,
  Moon,
  Sun,
  ShieldAlert,
  Cpu,
  ChevronDown
} from "lucide-react";
import { ProtocolBackground } from "../ui/ProtocolBackground";
import { Logo } from "../ui/Logo";
import { useTheme } from "../ui/ThemeProvider";

interface LandingViewProps {
  onStart: () => void;
  onExplorePortfolio: () => void;
  isAuthenticated?: boolean;
}

const terminalLines = [
  { prompt: "$", text: "napsed verify --identity @alex_r", tone: "text-theme-ink" },
  { prompt: "✓", text: "GitHub identity attested", tone: "text-theme-ink" },
  { prompt: "✓", text: "3 architectural defenses verified", tone: "text-theme-ink" },
  { prompt: "✓", text: "immutable proof card issued: napsed.com/@alex_r", tone: "text-theme-ink/60" },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onStart,
  onExplorePortfolio,
  isAuthenticated = false,
}) => {
  const [command, setCommand] = useState("verify --network");
  const [logs, setLogs] = useState(terminalLines);
  const { theme, setTheme } = useTheme();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const run = (event: React.FormEvent) => {
    event.preventDefault();
    if (!command.trim()) return;
    if (command.trim() === "start") {
      onStart();
      return;
    }

    setLogs((current) => [
      ...current,
      { prompt: ">", text: command, tone: "text-theme-ink" },
      {
        prompt: "✓",
        text: command.includes("clear")
          ? "Terminal buffer cleared."
          : "Deterministic verifiers: healthy · Sub-30ms p99 latencies",
        tone: "text-theme-ink",
      },
    ]);
    setCommand("");
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "How does deterministic verification work?",
      a: "Instead of generic unit tests, we run your code against strict sanitizers (e.g., Go's -race detector) under simulated load to measure real P99 latencies and memory constraints."
    },
    {
      q: "Do I need to install anything locally?",
      a: "No. You can practice directly in our client-side WASM environment. Pro users get access to server-side Judge0 containers for heavy concurrency specs."
    },
    {
      q: "Who owns the code I write?",
      a: "You do. Your submissions remain yours, and your public proof portfolio can be linked directly on your resume or personal site."
    },
    {
      q: "What happens if my solution fails the defense gate?",
      a: "If your written architectural defense lacks depth or fails peer scrutiny, you will receive concrete feedback and can iterate. Immutable proofs are only minted for well-defended trade-offs."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-hidden bg-transparent font-sans text-theme-ink"
    >
      <ProtocolBackground opacityClassName="opacity-70" />

      {/* Lean Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b recessed-meter bg-theme-base/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Logo size="md" light={theme === 'dark'} />
          </button>
          
          <div className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-wider font-bold">
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-theme-ink/70 transition">How it Works</button>
            <button onClick={() => scrollTo('features')} className="hover:text-theme-ink/70 transition">Features</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-theme-ink/70 transition">Pricing</button>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-theme-ink/70 transition flex items-center gap-1">Docs</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center tactile-btn-secondary h-[34px] w-[40px] rounded-none transition"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-theme-ink" />
              ) : (
                <Moon className="h-4 w-4 text-theme-ink" />
              )}
            </button>

            <button
              onClick={onStart}
              className="tactile-btn-primary rounded-none px-4 py-1.5 text-xs uppercase font-bold tracking-wider text-theme-base"
            >
              {isAuthenticated ? "GO TO FEED" : "SIGN IN"}
            </button>
          </div>
        </div>
      </div>

      <main className="relative z-10 pt-24 mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* 1. Hero Section */}
        <div className="grid items-center gap-12 lg:grid-cols-2 py-12">
          <section>
            <p className="font-mono tabular-nums text-xs uppercase tracking-wider text-theme-ink/60 flex items-center gap-2">
              <span className="status-lens-verified inline-block h-2 w-2" />
              100% Deterministic Verification // Zero Algorithmic LeetCode Fluff
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight uppercase sm:text-6xl leading-[1.1]">
              PROVE YOUR ENGINEERING SKILLS WITH{" "}
              <span className="text-theme-ink">DETERMINISTIC VERIFICATION.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-theme-ink/70 font-medium">
              Stop grinding algorithmic puzzles. Debug authentic brownfield systems, pass race-condition sanitizers, and earn immutable proof-of-work verified by senior engineering tracks.
            </p>
            <div className="mt-8 flex flex-col items-start gap-2">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onStart}
                  className="tactile-btn-primary flex items-center gap-2 rounded-none px-6 py-3.5 text-sm uppercase font-bold tracking-wider text-theme-base"
                >
                  TRY IN BROWSER <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onExplorePortfolio}
                  className="tactile-btn-secondary rounded-none px-5 py-3.5 text-sm uppercase font-bold tracking-wider text-theme-ink"
                >
                  EXPLORE VERIFIED WORK
                </button>
              </div>
              <p className="text-micro font-mono text-theme-ink/60 mt-1">No credit card required • Sign in with GitHub</p>
            </div>
          </section>

          <section className="rounded-none chassis-plate four-screws p-5 bg-theme-base shadow-2xl">
            <div className="screw-tr"></div><div className="screw-bl"></div>
            <div className="flex items-center justify-between border-b border-theme-ink pb-3 font-mono text-xs uppercase tracking-wider text-theme-ink">
              <span>
                <Terminal className="mr-1 inline h-4 w-4 text-theme-ink" />
                PROTOCOL CLI
              </span>
              <span className="flex items-center gap-1.5">
                <span className="status-lens-verified inline-block h-1.5 w-1.5"></span>
                ONLINE
              </span>
            </div>
            <div className="h-64 space-y-1 overflow-y-auto py-4 font-mono tabular-nums text-xs text-theme-ink">
              {logs.map((log, index) => (
                <p key={index} className={log.tone}>
                  <span className="mr-3 inline-block w-3 text-theme-ink/40">
                    {log.prompt}
                  </span>
                  {log.text}
                </p>
              ))}
            </div>
            <form onSubmit={run} className="flex gap-2">
              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                className="min-w-0 flex-1 rounded-none recessed-meter px-3 py-2 font-mono text-xs text-theme-ink outline-none bg-transparent focus:ring-1 focus:ring-theme-ink"
                placeholder="start"
              />
              <button className="tactile-btn-accent rounded-none px-3 text-xs uppercase font-bold tracking-wider text-[#FFF]">
                RUN
              </button>
            </form>
          </section>
        </div>

        {/* 2. Social Proof / Tech Stack */}
        <section className="py-10 border-t border-b border-theme-ink/20 flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-80 select-none">
          {["Go", "Rust", "PostgreSQL", "Docker", "Linux", "Kubernetes"].map(tech => (
            <span key={tech} className="font-mono text-sm uppercase tracking-widest font-bold text-theme-ink flex items-center gap-2">
               <Cpu className="w-4 h-4"/> {tech}
            </span>
          ))}
        </section>

        {/* 3. Problem vs Solution */}
        <section className="py-20 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest">Tired of Generic Coding Puzzles?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-none chassis-plate four-screws p-6 border-theme-ink/50 bg-[#1D1F23]/5">
              <div className="screw-tr"></div><div className="screw-bl"></div>
              <h3 className="font-mono font-bold text-sm text-theme-ink/60 mb-4 uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4"/> The Status Quo
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex items-start gap-2"><span className="text-theme-ink font-mono text-lg leading-none">×</span> Abstract algorithms with no real-world constraints.</li>
                <li className="flex items-start gap-2"><span className="text-theme-ink font-mono text-lg leading-none">×</span> Meaningless badges that don't prove systems knowledge.</li>
                <li className="flex items-start gap-2"><span className="text-theme-ink font-mono text-lg leading-none">×</span> Unverified resumes heavily embellished by AI generation.</li>
              </ul>
            </div>
            
            <div className="rounded-none chassis-plate four-screws p-6 ring-1 ring-theme-ink bg-theme-ink/5">
              <div className="screw-tr"></div><div className="screw-bl"></div>
              <h3 className="font-mono font-bold text-sm text-theme-ink mb-4 uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4"/> The Napsed Protocol
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex items-start gap-2"><span className="text-theme-ink font-mono font-bold text-lg leading-none">✓</span> Real-world brownfield specs with P99 latency targets.</li>
                <li className="flex items-start gap-2"><span className="text-theme-ink font-mono font-bold text-lg leading-none">✓</span> Architectural trade-off defenses mandated for every fix.</li>
                <li className="flex items-start gap-2"><span className="text-theme-ink font-mono font-bold text-lg leading-none">✓</span> Immutable proof credentials tied to your engineering identity.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. How It Works (3-Step Guide) */}
        <section id="how-it-works" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest">How It Works</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Select a Brownfield Spec",
                desc: "Choose an authentic scenario (e.g., token bucket rate limiter, connection pool leak, replica lag). No contrived puzzles."
              },
              {
                step: "02",
                title: "Fix & Pass Sanitizers",
                desc: "Debug the code in-browser or via Judge0 with -race detection and strict sub-30ms P99 latency targets."
              },
              {
                step: "03",
                title: "Clear the Defense Gate",
                desc: 'Answer the mandatory prompt ("What did you do, and why?") to publish an immutable proof card to napsed.com/@handle.'
              }
            ].map((item) => (
              <div key={item.step} className="rounded-none chassis-plate four-screws p-6 relative">
                 <div className="screw-tr"></div><div className="screw-bl"></div>
                 <span className="absolute -top-4 -left-2 text-5xl font-extrabold text-theme-ink/10 font-mono select-none">{item.step}</span>
                 <h3 className="font-bold uppercase tracking-wider mt-2 relative z-10">{item.title}</h3>
                 <p className="mt-3 text-sm leading-relaxed text-theme-ink/70 font-medium relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Feature & Benefit Breakdown */}
        <section id="features" className="py-20 space-y-24">
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div>
               <h3 className="text-2xl font-extrabold uppercase tracking-wider mb-4">WASM & Judge0 Runtime Verification</h3>
               <p className="text-sm font-medium leading-relaxed text-theme-ink/70 mb-6">
                 Code execution happens securely. Practice instantly in the browser via WebAssembly, or tackle heavy distributed systems specs utilizing our server-side Judge0 containers for advanced concurrency and network tests.
               </p>
               <ul className="space-y-2 font-mono text-xs uppercase font-bold text-theme-ink">
                 <li className="flex gap-2"><CheckCircle2 className="w-4 h-4"/> Memory Leak Sanitizers</li>
                 <li className="flex gap-2"><CheckCircle2 className="w-4 h-4"/> Race Condition Detectors</li>
               </ul>
             </div>
             <div className="rounded-none chassis-plate four-screws p-1 bg-theme-ink">
                <pre className="p-4 text-theme-base bg-[#1D1F23] text-xs font-mono overflow-hidden">
{`$ go test -race ./...
==================
WARNING: DATA RACE
Write at 0x00c0000a6030 by goroutine 8:
  main.(*Pool).Acquire()
      /src/pool.go:42
...
Found 1 data race(s)`}
                </pre>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="order-2 md:order-1 rounded-none chassis-plate four-screws p-6 bg-theme-base shadow-xl">
               <div className="screw-tr"></div><div className="screw-bl"></div>
               <div className="space-y-4">
                 <div className="border border-theme-ink p-3">
                   <p className="font-mono text-xs uppercase font-bold text-theme-ink/60 mb-1">Defense Prompt</p>
                   <p className="text-sm font-medium">Why did you use a Read-Write Mutex instead of a standard Mutex?</p>
                 </div>
                 <div className="border border-theme-ink p-3 bg-theme-ink/5">
                   <p className="font-mono text-xs uppercase font-bold text-theme-ink/60 mb-1">Your Defense</p>
                   <p className="text-sm font-medium">"Reads far outnumber writes in the token bucket validation path. RWMutex reduces lock contention..."</p>
                 </div>
               </div>
             </div>
             <div className="order-1 md:order-2">
               <h3 className="text-2xl font-extrabold uppercase tracking-wider mb-4">The Defense Gate</h3>
               <p className="text-sm font-medium leading-relaxed text-theme-ink/70">
                 Writing passing code isn't enough. Every successful execution must be paired with an architectural defense explaining the trade-offs, ensuring you understand the "why" behind the fix.
               </p>
             </div>
          </div>

        </section>

        {/* 6. Pricing */}
        <section id="pricing" className="py-20 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest">Simple, Transparent Pricing</h2>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="rounded-none chassis-plate four-screws p-10 ring-2 ring-theme-ink bg-theme-ink/5 flex flex-col relative overflow-hidden">
              <div className="screw-tr"></div><div className="screw-bl"></div>
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-mono uppercase bg-theme-ink text-theme-base px-3 py-1 font-bold">7-Day Free Trial</span>
              </div>
              <h3 className="font-mono font-bold uppercase tracking-wider text-theme-ink mb-2">Staff Engineer Access</h3>
              <div className="text-4xl font-extrabold font-mono tabular-nums mb-6">₹199<span className="text-sm text-theme-ink/60 font-sans font-bold">/mo</span> <span className="text-xs text-theme-ink/60 font-sans font-medium">(or $12/mo Global)</span></div>
              <ul className="space-y-4 text-sm font-medium flex-1 mb-10">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5"/> Unlimited WASM & Judge0 server-side concurrency specs.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5"/> Advanced -race telemetry & latency deltas.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5"/> Peer-audited defense submissions.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5"/> Public immutable proof profile.</li>
              </ul>
              <div className="space-y-3">
                <button onClick={onStart} className="tactile-btn-primary w-full py-4 uppercase font-bold tracking-wider text-sm text-theme-base">Start 7-Day Free Trial</button>
                <p className="text-center text-xs font-mono text-theme-ink/60">No credit card required until day 7.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ & Objection Handling */}
        <section id="faq" className="py-16 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold uppercase tracking-widest">Protocol Specifications (FAQ)</h2>
          </div>
          <div className="space-y-3">
             {faqs.map((faq, idx) => (
               <div key={idx} className="rounded-none chassis-plate four-screws p-1 transition-all duration-200">
                 <button 
                   onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                   className="w-full text-left p-4 flex justify-between items-center bg-theme-base font-bold uppercase tracking-wider text-sm"
                 >
                   {faq.q}
                   <ChevronDown className={`w-4 h-4 transition-transform ${openFaqIndex === idx ? "rotate-180" : ""}`} />
                 </button>
                 <AnimatePresence>
                   {openFaqIndex === idx && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: "auto", opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                     >
                       <div className="p-4 pt-0 text-sm font-medium leading-relaxed text-theme-ink/70">
                         {faq.a}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             ))}
          </div>
        </section>

        {/* 8. Final Call to Action */}
        <section className="py-20 text-center">
          <div className="mx-auto max-w-3xl rounded-none chassis-plate four-screws p-10 sm:p-16 relative overflow-hidden bg-theme-base">
            <div className="screw-tr"></div><div className="screw-bl"></div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-theme-ink mb-4 tracking-tight uppercase leading-[1.1]">
              READY TO VALIDATE YOUR ARCHITECTURE?
            </h2>
            <p className="text-sm text-theme-ink/70 mb-8 leading-relaxed max-w-lg mx-auto font-medium">
              Join infrastructure, backend, and systems engineers building un-fakeable proof-of-work identities backed by deterministic systems evaluation.
            </p>

            <button
              onClick={onStart}
              className="tactile-btn-primary inline-flex items-center gap-2.5 rounded-none px-8 py-4 text-sm uppercase font-bold tracking-wider text-theme-base shadow-2xl"
            >
              <span>ENTER THE PROTOCOL NOW</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Functional Footer */}
      <footer className="border-t border-theme-ink/20 py-12 mt-12 bg-theme-base">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Logo size="sm" light={theme === 'dark'} />
              <p className="mt-4 font-mono text-xs text-theme-ink/50 uppercase tracking-widest">
                 The Engineering Identity Protocol.
              </p>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-xs mb-4">Product</h4>
              <ul className="space-y-2 text-sm font-medium text-theme-ink/70">
                <li><button onClick={() => scrollTo('features')} className="hover:text-theme-ink transition">Features</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-theme-ink transition">How it Works</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-theme-ink transition">Pricing</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-xs mb-4">Resources</h4>
              <ul className="space-y-2 text-sm font-medium text-theme-ink/70">
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-theme-ink transition">Documentation</a></li>
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-theme-ink transition">Status Monitor</a></li>
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-theme-ink transition">GitHub Repository</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-xs mb-4">Legal</h4>
              <ul className="space-y-2 text-sm font-medium text-theme-ink/70">
                <li><a href="#" className="hover:text-theme-ink transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-theme-ink transition">Terms of Service</a></li>
              </ul>
            </div>
         </div>
      </footer>
    </motion.div>
  );
};
