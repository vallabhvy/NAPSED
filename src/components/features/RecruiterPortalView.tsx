import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Download, 
  Mail, 
  Code, 
  ChevronDown, 
  ChevronUp,
  Check,
  Inbox
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

export const RecruiterPortalView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [candidates] = useState<any[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [requestedIntros, setRequestedIntros] = useState<Record<string, boolean>>({});

  const filteredCandidates = candidates.filter(c => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase()) || 
                         c.role.toLowerCase().includes(query.toLowerCase()) ||
                         c.verifiedTracks.some((t: string) => t.toLowerCase().includes(query.toLowerCase()));
    return matchesQuery;
  });

  const handleRequestIntro = (id: string) => {
    setRequestedIntros({ ...requestedIntros, [id]: true });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans bg-transparent text-theme-ink"
    >
      
      {/* Header Banner */}
      <div className="rounded-none chassis-plate p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-none bg-theme-base text-theme-ink px-2.5 py-1 text-micro font-mono font-semibold border border-theme-ink uppercase tracking-wider">
              RECRUITER & HIRING MANAGER PORTAL
            </span>
          </div>
          <h1 className="text-2xl font-bold text-theme-ink tracking-tight uppercase">INSPECT PEER-REVIEWED ENGINEERING PORTFOLIOS</h1>
          <p className="text-xs text-theme-ink mt-1 max-w-2xl font-sans">
            Inspect real source code, written architectural trade-off defenses, and peer review scorecards signed by senior auditors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-none recessed-meter p-3 text-center">
            <div className="text-lg font-bold font-mono tabular-nums text-theme-ink">100%</div>
            <div className="text-micro text-theme-ink/60 uppercase tracking-wider font-mono">VERIFIED CODE</div>
          </div>
          <div className="rounded-none recessed-meter p-3 text-center">
            <div className="text-lg font-bold font-mono tabular-nums text-theme-ink">14,290</div>
            <div className="text-micro text-theme-ink/60 uppercase tracking-wider font-mono">AUDITED BUILDS</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-theme-ink pb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-theme-ink" />
          <input
            type="text"
            placeholder="FILTER BY SKILL E.G. TERRAFORM, REDIS, LUA..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-none recessed-meter pl-9 pr-3.5 py-2 text-xs text-theme-ink placeholder-[#1D1F23]/40 focus:outline-none uppercase font-medium tracking-wider"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'DEVOPS & IAC', 'DISTRIBUTED SYSTEMS', 'CLOUD SECURITY'].map((track) => (
            <button
              key={track}
              onClick={() => setSelectedTrack(track)}
              className={`rounded-none px-3 py-1.5 text-xs uppercase font-medium tracking-wider transition shrink-0 border ${
                selectedTrack === track
                  ? 'bg-[#1D1F23] text-theme-base border-theme-ink'
                  : 'bg-transparent text-theme-ink border-transparent hover:border-theme-ink'
              }`}
            >
              {track}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates List */}
      {filteredCandidates.length === 0 ? (
        <EmptyState
          title="NO VERIFIED CANDIDATES FOUND"
          description="THERE ARE NO VERIFIED CANDIDATES MATCHING THIS SEARCH FILTER IN THE DATABASE."
          icon={Inbox}
        />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {filteredCandidates.map((cand) => {
          const isExpanded = expandedCandidate === cand.id;
          const introRequested = requestedIntros[cand.id];

          return (
            <motion.div 
              key={cand.id}
              variants={itemVariants}
              className="rounded-none chassis-plate overflow-hidden hover:bg-theme-base transition"
            >
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                <div className="flex items-start gap-4">
                  <img src={cand.avatar} alt={cand.name} className="h-14 w-14 rounded-none object-cover border border-theme-ink shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold uppercase tracking-wider text-theme-ink">{cand.name}</h2>
                      <span className="status-lens-verified inline-block w-2.5 h-2.5"></span>
                      <span className="rounded-none bg-theme-base text-theme-ink px-2 py-0.5 text-micro font-mono tabular-nums font-semibold border border-theme-ink uppercase tracking-wider">
                        {cand.matchScore}% MATCH
                      </span>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-theme-ink/60 mt-0.5 uppercase tracking-wider">{cand.role}</div>
                    <div className="text-xs text-theme-ink/60 mt-1 uppercase tracking-wider">{cand.location}</div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {cand.verifiedTracks.map((t: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-none recessed-meter px-2.5 py-0.5 text-micro font-mono uppercase tracking-wider text-theme-ink">
                          <Check className="h-3 w-3 text-theme-ink" />
                          <span>[{t}]</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-center">
                  <div className="p-2.5 rounded-none recessed-meter">
                    <div className="text-sm font-bold font-mono tabular-nums text-theme-ink">{cand.acceptanceRate}</div>
                    <div className="text-micro text-theme-ink/60 uppercase font-mono tracking-wider">AUDIT PASS</div>
                  </div>
                  <div className="p-2.5 rounded-none recessed-meter">
                    <div className="text-sm font-bold font-mono tabular-nums text-theme-ink">{cand.karma}</div>
                    <div className="text-micro text-theme-ink/60 uppercase font-mono tracking-wider">KARMA</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleRequestIntro(cand.id)}
                      disabled={introRequested}
                      className={`flex items-center justify-center gap-2 rounded-none px-4 py-2 text-xs uppercase font-medium tracking-wider transition border ${
                        introRequested
                          ? 'bg-theme-base text-theme-ink border-theme-ink'
                          : 'bg-[#1D1F23] text-theme-base border-theme-ink hover:bg-transparent hover:text-theme-ink'
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{introRequested ? 'INTRO SENT ✓' : 'REQUEST INTRO'}</span>
                    </button>

                    <button
                      onClick={() => setExpandedCandidate(isExpanded ? null : cand.id)}
                      className="flex items-center justify-center gap-1 text-xs text-theme-ink/60 hover:text-theme-ink font-mono uppercase tracking-wider"
                    >
                      <span>{isExpanded ? 'HIDE CODE PROOF' : 'INSPECT CODE & DEFENSE'}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

              </div>

              {isExpanded && (
                <div className="p-6 border-t recessed-meter space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-theme-ink/60 pb-2 border-b border-theme-ink text-micro uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-theme-ink font-semibold">
                      <Code className="h-4 w-4 text-theme-ink" />
                      FEATURED BUILD: {cand.topBuild}
                    </span>
                    <span className="text-theme-ink">{cand.auditedBy}</span>
                  </div>

                  <p className="text-theme-ink font-sans text-xs leading-relaxed">
                    <strong>WRITTEN DEFENSE SUMMARY:</strong> "Used explicit State Enums and Redis atomic Lua scripts to eliminate race conditions under 10k requests/second. Code reviewed and approved by Staff SRE."
                  </p>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-micro text-theme-ink/60 uppercase tracking-wider">PEER AUDIT REF: #AUDIT_REF_9921_VERIFIED</span>
                    <button className="flex items-center gap-1 text-xs text-theme-ink hover:underline uppercase tracking-wider">
                      <Download className="h-3.5 w-3.5" />
                      <span>DOWNLOAD PDF DIGEST</span>
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          );
        })}
      </motion.div>
      )}

    </motion.div>
  );
};
