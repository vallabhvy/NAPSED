import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import type { ProofCredential, UserProfile } from "../../types";
import { fetchPublicProfileByHandle } from "../../services/api";
import { PortfolioView } from "./PortfolioView";
import { ProtocolBackground } from "../ui/ProtocolBackground";

interface PublicProofViewProps {
  handle: string;
  onNavigateHome: () => void;
  onEnterSandbox: () => void;
  isAuthenticated?: boolean;
}

export const PublicProofView: React.FC<PublicProofViewProps> = ({
  handle,
  onNavigateHome,
  onEnterSandbox,
  isAuthenticated = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    user: UserProfile;
    credentials: ProofCredential[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanHandle = handle.trim().replace(/^@/, "");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicProfileByHandle(cleanHandle)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setError(`No engineer identity or GitHub profile was found matching @${cleanHandle}.`);
        } else {
          setData(res);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Public proof fetch error:", err);
        setError(`Failed to verify proof ledger for @${cleanHandle}. Please retry.`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cleanHandle]);

  return (
    <div className="min-h-screen bg-theme-base text-theme-ink relative overflow-hidden flex flex-col">
      <ProtocolBackground opacityClassName="opacity-60" />

      {/* Top Industrial Hardware Header */}
      <header className="sticky top-0 left-0 right-0 z-50 border-b recessed-meter bg-theme-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2 hover:opacity-80 transition shrink-0"
              title="Return to Napsed Home"
            >
              <div className="h-6 w-6 rounded-none bg-theme-ink flex items-center justify-center text-theme-base font-mono font-bold text-xs">
                N
              </div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-theme-ink">
                NAPSED
              </span>
            </button>

            <span className="text-theme-ink/30 font-mono text-xs">/</span>

            <span className="inline-flex items-center gap-1.5 font-mono text-nano uppercase tracking-widest text-theme-ink/70 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
              PROOF CARD
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hidden sm:inline-flex items-center gap-1 font-mono text-nano uppercase tracking-wider text-theme-ink/70 hover:text-theme-ink transition font-bold"
            >
              <ArrowLeft className="w-3 h-3" aria-hidden />
              Home
            </button>

            <button
              type="button"
              onClick={onEnterSandbox}
              className="tactile-btn-primary px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-theme-base flex items-center gap-1.5 shrink-0"
            >
              {isAuthenticated ? "Open Dashboard →" : "Enter Sandbox →"}
            </button>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="flex-1 relative z-10 py-6 sm:py-10">
        {loading ? (
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <div className="inline-block h-3 w-3 rounded-none bg-emerald-500 animate-pulse mb-3"></div>
            <p className="font-mono text-xs uppercase tracking-widest text-theme-ink font-bold">
              RESOLVING VERIFIABLE LEDGER FOR @{cleanHandle.toUpperCase()}…
            </p>
            <p className="mt-2 font-mono text-nano uppercase tracking-wider text-theme-ink/50">
              Verifying cryptographic consensus & GitHub identity attestation
            </p>
          </div>
        ) : error || !data ? (
          <div className="mx-auto max-w-xl px-4 py-16">
            <div className="rounded-none chassis-plate four-screws p-8 bg-theme-base border border-theme-ink text-center relative">
              <div className="screw-tr"></div>
              <div className="screw-bl"></div>

              <div className="inline-flex items-center justify-center w-10 h-10 rounded-none recessed-meter border border-theme-ink text-theme-ink mb-4 font-mono font-bold">
                !
              </div>

              <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-theme-ink mb-2">
                ENGINEER IDENTITY NOT FOUND
              </h2>
              <p className="text-xs text-theme-ink/70 leading-relaxed font-sans mb-6">
                {error || `No candidate credentials found for @${cleanHandle}.`}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="w-full sm:w-auto tactile-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-theme-ink"
                >
                  ← Return to Home
                </button>
                <a
                  href={`https://github.com/${encodeURIComponent(cleanHandle)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto tactile-btn-primary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-theme-base inline-flex items-center justify-center gap-1.5"
                >
                  Check GitHub Profile
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <PortfolioView
            user={data.user}
            credentials={data.credentials}
            isPublicView={true}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t recessed-meter py-4 px-4 sm:px-6 relative z-10 bg-theme-base/80">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2 text-theme-ink/60 font-mono text-nano uppercase tracking-widest">
          <span>NAPSED PROTOCOL · ZERO PAYWALLS · IMMUTABLE ARCHITECTURE PROOFS</span>
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-theme-ink transition font-bold"
          >
            napsed.com
          </button>
        </div>
      </footer>
    </div>
  );
};
