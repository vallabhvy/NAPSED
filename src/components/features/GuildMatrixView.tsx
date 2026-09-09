import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Code, Inbox, Server } from 'lucide-react';
import { getGuilds } from '../../services/api';
import { GuildCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { VSCodeEditor } from '../ui/VSCodeEditor';
import type { Spec, DomainTrack } from '../../types';

interface Guild { id: string; name: string; slug: DomainTrack; description: string; icon: string; verifiedCount: number; challengesCount: number; verifiers: string[]; }
interface GuildMatrixViewProps { challenges: Spec[]; onOpenChallenge: (challengeId: string) => void; }

export const GuildMatrixView: React.FC<GuildMatrixViewProps> = ({ challenges, onOpenChallenge }) => {
  const [guilds, setGuilds] = useState<Guild[]>([]); const [isLoading, setIsLoading] = useState(true); const [selectedGuildSlug, setSelectedGuildSlug] = useState<DomainTrack | null>(null);
  useEffect(() => { getGuilds().then((data) => { setGuilds(data); setSelectedGuildSlug(data[0]?.slug ?? null); }).finally(() => setIsLoading(false)); }, []);
  const selectedGuild = guilds.find((guild) => guild.slug === selectedGuildSlug);
  const icons = { Server } as Record<string, React.ElementType>;
  const openChallenge = () => onOpenChallenge(challenges.find((challenge) => challenge.track === selectedGuildSlug)?.id || challenges[0]?.id || '');

  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto max-w-7xl space-y-8 px-4 py-8 font-sans text-theme-ink sm:px-6 lg:px-8">
    <header>
      <span className="rounded-none chassis-plate px-2 py-0.5 font-mono text-micro uppercase tracking-wider text-theme-ink">DOMAIN MATRIX</span>
      <h1 className="mt-2 text-2xl font-bold uppercase tracking-wider">VERIFIED ENGINEERING GUILDS</h1>
      <p className="mt-1 text-xs text-theme-ink/60 uppercase tracking-wider">SPECIALIZED TRACKS BACKED BY SENIOR PEER VERIFICATION.</p>
    </header>
    {isLoading ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4"><GuildCardSkeleton /><GuildCardSkeleton /><GuildCardSkeleton /><GuildCardSkeleton /></div> : guilds.length === 0 ? <EmptyState title="NO ENGINEERING GUILDS FOUND" description="THERE ARE NO ACTIVE DOMAIN GUILDS IN THE DATABASE RIGHT NOW." icon={Inbox} /> : <><div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">{guilds.map((guild) => { const selected = guild.slug === selectedGuildSlug; return <button key={guild.id} onClick={() => setSelectedGuildSlug(guild.slug)} className={`rounded-none p-5 text-left transition-all duration-100 ${selected ? 'recessed-meter ring-1 ring-theme-ink' : 'chassis-plate hover:shadow-none hover:translate-y-[2px]'}`}><h2 className="mt-2 text-sm font-bold uppercase tracking-wider">{guild.name}</h2><p className="mt-1 min-h-10 text-xs text-theme-ink/60">{guild.description}</p><p className="mt-4 font-mono tabular-nums text-micro text-theme-ink uppercase tracking-wider">{guild.verifiedCount} VERIFIED · {guild.challengesCount} CHALLENGES</p></button>; })}</div>
    {selectedGuild && <section className="rounded-none chassis-plate four-screws p-6"><div className="screw-tr"></div><div className="screw-bl"></div><div className="flex flex-col justify-between gap-4 border-b border-theme-ink pb-5 md:flex-row md:items-center"><div><h2 className="text-lg font-bold uppercase tracking-wider">{selectedGuild.name} TRACK DETAILS</h2><p className="mt-1 text-xs text-theme-ink/60 uppercase tracking-wider">DOMAIN VERIFIERS: {selectedGuild.verifiers.join(', ')}</p></div><button onClick={openChallenge} className="tactile-btn-primary flex items-center gap-2 rounded-none px-4 py-2 text-xs uppercase font-bold tracking-wider text-theme-base"><Code className="h-4 w-4" />TAKE VERIFICATION CHALLENGE</button></div><div className="grid gap-6 pt-6 lg:grid-cols-2"><div><h3 className="font-mono text-xs font-bold uppercase tracking-wider text-theme-ink/60">REFERENCE IMPLEMENTATION</h3><div className="mt-3"><VSCodeEditor code={'resource "service" "verified" {\n  strategy = "zero-downtime"\n  audit    = "required"\n}'} readOnly fileName="guild-proof.tf" language="terraform" /></div></div><div><h3 className="font-mono text-xs font-bold uppercase tracking-wider text-theme-ink/60">VERIFICATION CRITERIA</h3><div className="mt-3 space-y-3">{['Production-safe implementation', 'Dual senior peer audit', 'Written architecture defense'].map((criterion) => <div key={criterion} className="flex gap-3 rounded-none recessed-meter p-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-theme-ink" /><div><p className="text-xs font-semibold uppercase tracking-wider">{criterion}</p><p className="mt-1 text-micro text-theme-ink/60">Demonstrate the trade-offs and failure handling behind the solution.</p></div></div>)}</div></div></div></section>}</>}
  </motion.div>;
};
