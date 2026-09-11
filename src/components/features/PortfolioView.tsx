import React, { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, ExternalLink, Globe, RefreshCw, Search } from "lucide-react";
import type { ProofCredential, UserProfile } from "../../types";
import { fetchGithubUserProfile } from "../../services/github";
import { fetchProofCredentials } from "../../services/api";
import { Avatar } from "../ui/Avatar";

interface PortfolioViewProps {
  user: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  credentials?: ProofCredential[];
  isPublicView?: boolean;
}

function storedHandle(user: UserProfile, isPublic?: boolean) {
  if (isPublic) {
    return user.githubUsername || user.username || "";
  }
  return (
    localStorage.getItem("napsed_github_handle") ||
    localStorage.getItem("devproof_github_handle") ||
    user.githubUsername ||
    user.username ||
    ""
  );
}

function formatIssued(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(iso));
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  user,
  onUpdateUser,
  credentials: credentialsProp,
  isPublicView = false,
}) => {
  const [handle, setHandle] = useState(() => storedHandle(user, isPublicView));
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [credentials, setCredentials] = useState<ProofCredential[]>(
    credentialsProp ?? [],
  );
  const [credentialsLoading, setCredentialsLoading] = useState(!credentialsProp);
  const reduceMotion = useReducedMotion();
  const syncInputId = useId();
  const syncStatusId = useId();

  const publicHandle = (user.githubUsername || user.username || handle || "handle")
    .trim()
    .replace(/^@/, "");
  const proofUrl = `napsed.com/@${publicHandle}`;
  const proofHref = `https://napsed.com/@${publicHandle}`;

  const credentialCount = credentials.length;
  const isSealed = credentialCount > 0;
  const latestIssuedAt = isSealed
    ? [...credentials].sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      )[0]?.issuedAt
    : null;

  const loadCredentials = async (authorId: string) => {
    if (!authorId || authorId.startsWith("user_")) {
      setCredentials([]);
      setCredentialsLoading(false);
      return;
    }
    setCredentialsLoading(true);
    const rows = await fetchProofCredentials(authorId);
    setCredentials(rows);
    setCredentialsLoading(false);
  };

  const sync = async (value: string) => {
    const username = value.trim().replace(/^@/, "");
    if (!username) return;
    setIsSyncing(true);
    setMessage(`FETCHING GITHUB PROFILE FOR @${username.toUpperCase()}…`);
    try {
      const profile = await fetchGithubUserProfile(username);
      if (profile) {
        onUpdateUser?.({
          name: profile.name,
          username: profile.username,
          githubUsername: profile.username,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio || user.bio,
          company: profile.company,
          location: profile.location,
          publicReposCount: profile.publicReposCount,
          followersCount: profile.followersCount,
          githubUrl: profile.githubUrl,
          websiteUrl: profile.websiteUrl || user.websiteUrl,
        });
        localStorage.setItem("napsed_github_handle", username);
        setMessage(`LINKED @${username.toUpperCase()} TO NAPSED PROOF PROFILE.`);
      } else {
        setMessage(`COULD NOT FIND @${username.toUpperCase()}.`);
      }
    } catch {
      setMessage("COULD NOT CONNECT TO GITHUB.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!isPublicView && handle) void sync(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (credentialsProp) {
      setCredentials(credentialsProp);
      setCredentialsLoading(false);
      return;
    }
    void loadCredentials(user.id);
  }, [user.id, credentialsProp]);

  const copyProofLink = async () => {
    try {
      await navigator.clipboard.writeText(proofHref);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setMessage("CLIPBOARD UNAVAILABLE — COPY THE PROOF URL MANUALLY.");
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      }
      className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 text-theme-ink font-sans"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-ink uppercase sm:text-3xl">
            PROOF CARD
          </h1>
          <p className="mt-1 max-w-xl text-xs uppercase tracking-wider text-theme-ink/60 leading-relaxed">
            PEER-AUDITED NAPSED CREDENTIALS FOR HIRING LEADS. SHARE THE PROOF URL ON RÉSUMÉS AND APPLICATIONS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyProofLink()}
          className="inline-flex min-h-11 items-center gap-2 rounded-none recessed-meter px-3 py-2 text-xs font-bold text-theme-ink hover:bg-[#1D1F23] hover:text-theme-base transition uppercase tracking-wider"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          <span className="font-mono text-xs tabular-nums">{proofUrl}</span>
          <span className="sr-only">{copied ? "Copied" : "Copy Proof URL"}</span>
        </button>
      </div>

      <article className="rounded-none chassis-plate relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b recessed-meter px-5 py-3 sm:px-7">
          <span className="font-mono text-micro font-bold uppercase tracking-wider text-theme-ink">
            NAPSED · PUBLIC PROOF PROFILE
          </span>
          {credentialsLoading ? (
            <span className="font-mono text-micro uppercase tracking-wider text-theme-ink/60">
              LOADING LEDGER…
            </span>
          ) : isSealed && latestIssuedAt ? (
            <span className="font-mono text-micro uppercase tracking-wider text-theme-ink/60">
              ISSUED {formatIssued(latestIssuedAt).toUpperCase()}
            </span>
          ) : (
            <span className="font-mono text-micro uppercase tracking-wider text-theme-ink/60">
              NO CREDENTIALS ISSUED
            </span>
          )}
        </div>

        <div className="relative px-5 py-8 sm:px-7 sm:py-9">
          <div className="mb-6 flex justify-end sm:mb-0 sm:absolute sm:right-8 sm:top-8 sm:z-10">
            {isSealed ? (
              <div className="flex flex-col items-center gap-1">
                <span className="status-lens-verified inline-block h-3 w-3"></span>
                <span className="font-mono text-pico uppercase tracking-wider text-theme-ink/80 font-bold mt-1">VERIFIED</span>
                <span className="font-mono text-pico uppercase tracking-wider text-theme-ink/60">
                  GUILD {credentials[0]?.guildAudits ?? "2/2"}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="inline-block h-3 w-3 chassis-plate"></span>
                <span className="font-mono text-pico uppercase tracking-wider text-theme-ink/80 font-bold mt-1">UNEARNED</span>
                <span className="font-mono text-pico uppercase tracking-wider text-theme-ink/60">
                  0/3 GATES
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-7 sm:pr-36">
            <Avatar
              src={user.avatarUrl}
              alt={user.name}
              className="h-20 w-20 rounded-none border border-theme-ink shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-theme-ink uppercase sm:text-3xl">
                  {user.name}
                </h2>
                <span className="font-mono text-xs text-theme-ink/60 uppercase tracking-wider">@{publicHandle}</span>
              </div>

              <p className="mt-3 max-w-prose text-xs leading-relaxed text-theme-ink">
                {user.bio ||
                  "NO DEFENSE ABSTRACT ON FILE. COMPLETE A MULTI-FILE SYSTEM CHALLENGE AND PASS THE ANTI-AI DEFENSE GATE TO PUBLISH REASONING HERE."}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-micro uppercase tracking-wider text-theme-ink/80 tabular-nums">
                <span>REPOS {user.publicReposCount ?? 0}</span>
                <span>FOLLOWERS {user.followersCount ?? 0}</span>
                {user.company && <span>{user.company}</span>}
                {user.location && <span>{user.location}</span>}
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-theme-ink hover:underline"
                  >
                    <Globe className="h-3 w-3" aria-hidden />
                    SITE
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="border-t border-theme-ink" aria-labelledby="verified-builds-heading">
          <div className="flex items-center justify-between bg-theme-base px-5 py-3 sm:px-7 border-b border-theme-ink">
            <h3
              id="verified-builds-heading"
              className="text-micro font-bold tracking-wider uppercase text-theme-ink"
            >
              VERIFIED ARCHITECTURE BUILDS
            </h3>
            <span className="font-mono tabular-nums text-micro text-theme-ink/60 uppercase tracking-wider">
              {credentialsLoading
                ? "…"
                : `${credentialCount} ${credentialCount === 1 ? "CREDENTIAL" : "CREDENTIALS"}`}
            </span>
          </div>

          {credentialsLoading ? (
            <div className="px-5 py-8 text-center font-mono text-micro uppercase tracking-wider text-theme-ink/60 sm:px-7">
              LOADING CREDENTIALS FROM NAPSED LEDGER…
            </div>
          ) : isSealed ? (
            <ul className="divide-y divide-[#1D1F23]">
              {credentials.map((cred) => (
                <li
                  key={cred.id}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 hover:bg-theme-base transition"
                >
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-theme-ink">{cred.title}</p>
                    <p className="mt-0.5 font-mono text-micro uppercase tracking-wider text-theme-ink/60">{cred.track}</p>
                    <div className="mt-2 flex flex-wrap gap-2 font-mono tabular-nums text-pico uppercase tracking-wider text-theme-ink">
                      {cred.hasDefense !== false && (
                        <span className="rounded-none recessed-meter px-2 py-0.5 font-bold">
                          DEFENSE GATE
                        </span>
                      )}
                      {cred.executionVerified && (
                        <span className="rounded-none recessed-meter px-2 py-0.5 font-bold">
                          EXECUTION VERIFIED
                        </span>
                      )}
                      {cred.sealHash && (
                        <span className="rounded-none border border-theme-ink bg-[#1D1F23] text-theme-base px-2 py-0.5">
                          SEAL {cred.sealHash.slice(0, 12)}…
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-mono tabular-nums text-micro uppercase tracking-wider text-theme-ink/60 sm:text-right mt-3 sm:mt-0">
                    <p>ISSUED {formatIssued(cred.issuedAt)}</p>
                    <p className="text-theme-ink font-bold">GUILD {cred.guildAudits}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-9 text-center sm:px-7">
              <p className="mx-auto max-w-md text-xs uppercase tracking-wider text-theme-ink/80 leading-relaxed font-sans">
                NO PEER-AUDITED PROOF CREDENTIALS YET. SOLVE A PRODUCTION-GRADE MULTI-FILE
                CHALLENGE, PASS THE ANTI-AI DEFENSE GATE, AND CLEAR A 2-MEMBER GUILD AUDIT TO
                PUBLISH ENTRIES HERE.
              </p>
              <p className="mt-4 font-mono tabular-nums text-nano font-bold uppercase tracking-widest text-theme-ink">
                BUILD → DEFEND → VERIFY
              </p>
            </div>
          )}
        </section>

        <section
          className="border-t border-theme-ink"
          aria-labelledby="guild-telemetry-heading"
        >
          <div className="bg-theme-base px-5 py-3 sm:px-7 border-b border-theme-ink">
            <h3
              id="guild-telemetry-heading"
              className="text-micro font-bold tracking-wider uppercase text-theme-ink"
            >
              GUILD TELEMETRY
            </h3>
          </div>
          <dl className="grid grid-cols-2 divide-x divide-y divide-[#1D1F23] border-b border-theme-ink sm:grid-cols-4">
            {[
              ["ROLE", user.role],
              ["KARMA", String(user.karmaPoints)],
              ["AUDITS", String(user.submissionsAudited)],
              ["ACCEPT", `${user.acceptanceRate}%`],
            ].map(([label, value]) => (
              <div key={label} className="bg-theme-surface px-4 py-3">
                <dt className="font-mono text-nano font-bold uppercase tracking-wider text-theme-ink/60">
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular-nums text-theme-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {user.guildBadges?.length ? (
            <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-7">
              {user.guildBadges.map((badge) => (
                <span
                  key={badge.id}
                  className="inline-flex items-center gap-1 rounded-none recessed-meter px-2 py-1 font-mono text-nano font-bold uppercase tracking-wider text-theme-ink"
                >
                  <Check className="h-3 w-3" aria-hidden />
                  {badge.name}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <footer className="flex flex-col gap-3 border-t recessed-meter px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="font-mono text-nano font-bold uppercase tracking-widest text-theme-ink/60">
            NAPSED ENGINEERING IDENTITY PROTOCOL
          </p>
          {user.githubUrl && (
            <a
              href={user.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-nano font-mono font-bold uppercase tracking-widest text-theme-ink hover:underline"
            >
              GITHUB SOURCE IDENTITY
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </footer>
      </article>

      {!isPublicView && (
        <details className="mt-6 rounded-none chassis-plate">
          <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-ink hover:bg-theme-base transition [&::-webkit-details-marker]:hidden">
            MANAGE IDENTITY (OWNER)
          </summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sync(handle);
            }}
            className="border-t recessed-meter px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex-1">
              <label htmlFor={syncInputId} className="block text-xs font-bold uppercase tracking-wider text-theme-ink">
                SYNC GITHUB IDENTITY
              </label>
              <p className="mt-1 text-micro uppercase tracking-wider text-theme-ink/60">
                PULLS PUBLIC PROFILE FIELDS INTO THIS PROOF CARD. DOES NOT ISSUE CREDENTIALS.
              </p>
              <div className="relative mt-3 max-w-xs">
                <Search
                  className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-theme-ink"
                  aria-hidden
                />
                <input
                  id={syncInputId}
                  value={handle}
                  onChange={(event) => setHandle(event.target.value)}
                  placeholder="GITHUB HANDLE"
                  autoComplete="username"
                  aria-describedby={message ? syncStatusId : undefined}
                  className="h-9 w-full rounded-none chassis-plate py-1.5 pl-8 pr-3 text-xs font-mono uppercase tracking-wider text-theme-ink outline-none focus:bg-theme-base"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSyncing}
  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-none tactile-btn-primary px-4 text-xs font-bold uppercase tracking-wider text-theme-base disabled:opacity-50 "
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                aria-hidden
              />
              {isSyncing ? "SYNCING…" : "SYNC"}
            </button>
          </form>
          {message && (
            <p
              id={syncStatusId}
              role="status"
              aria-live="polite"
              className="border-t chassis-plate px-4 py-3 font-mono tabular-nums text-nano font-bold uppercase tracking-wider text-theme-ink"
            >
              {message}
            </p>
          )}
        </details>
      )}
    </motion.div>
  );
};
