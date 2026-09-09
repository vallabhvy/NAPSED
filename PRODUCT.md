# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (v1):** Early-career developers, junior software engineers, and recent CS grads who need to differentiate themselves in an AI-saturated job market.

**Secondary creators:** Senior/Staff engineers who publish interactive, runnable multi-file system specs.

**Downstream audience:** Technical hiring managers who evaluate publicly verifiable Proof Card links (`napsed.dev/@handle`).

## Product Purpose

Napsed is an engineering identity protocol: developers solve production-grade multi-file system challenges in an in-browser IDE, pass an Anti-AI Defense Gate, and earn peer-audited Proof Credentials that prove genuine trade-off reasoning—not tutorial repos or static resumes.

**Core JTBD (v1):** Solve a production-grade multi-file system challenge → pass the Anti-AI Defense Gate → generate a publicly verifiable Proof Card link that hiring managers can trust.

**Secondary JTBD (monetization):** Verified senior engineers publish interactive runnable multi-file specs via paid channels with a 90/10 creator payout split.

## Positioning

Napsed replaces static resumes and copy-pasted tutorial repos with an in-browser multi-file IDE where developers must defend their system architecture trade-offs to earn peer-audited Proof Credentials.

## Operating Context

- GitHub identity is the sole entry gate.
- Build → Defend → Verify loop: multi-file sandbox work, architectural defense writing, then guild peer audit.
- Proof Cards are public profile artifacts meant to be shared with hiring managers.
- Spec authors publish into Guild Spec Channels; learners execute and defend against those specs.

## Capabilities and Constraints

**In v1**
- Public Proof Profiles (`napsed.dev/@handle`)
- In-browser multi-file IDE
- Guild Spec Channels
- Anti-AI Defense Gate + automated AI check + 2-member Guild audit before Proof Credentials issue

**Out of v1**
- Dedicated Recruiter Search Portals
- Paid B2B candidate dashboards

**Must lock**
- Auth: GitHub-only OAuth (`signInWithOAuth`)
- Verification pipeline: Defense Gate + automated AI check + 2-member Guild audit
- Infrastructure cost ceiling: $0-server-cost in-browser execution (WebAssembly / Web Workers) with Supabase Free Tier Postgres/Auth
- Data integrity: folder moves and node tree updates via atomic Postgres RPC `move_workspace_node` with strict RLS

**Terminology**
- Brand and product name everywhere: **Napsed** (not DevProof, not “The Low Level Club” as product brand)
- Proof Card / Proof Credentials / Anti-AI Defense Gate / Guild audit

## Brand Commitments

- Canonical name: **Napsed** — brand, product, and UI copy must use this everywhere.
- Public proof URLs use the `napsed.dev/@handle` pattern.
- Voice and visual world are owned by future DESIGN.md / incumbent UI; init records name authority only.

## Evidence on Hand

- Incumbent web app UI and copy (some surfaces still use legacy “DevProof” wording — treat as drift to rename, not alternate brand).
- Curated practice/system specs in the codebase.
- Logo and favicon assets under `public/`.
- Do not fabricate recruiter metrics, testimonials, or audited-build counts; empty DB feeds and placeholder recruiter stats are not product evidence.

## Product Principles

1. **Proof over pedigree** — Credentials come from defended, peer-audited work, not résumé claims.
2. **Defense is the product** — Trade-off reasoning through the Anti-AI Defense Gate is non-negotiable for verification.
3. **Zero compute tax** — Challenge execution stays client-side; keep the free-tier cost ceiling.
4. **Public verifiability** — Proof Cards are shareable identity artifacts for hiring managers.
5. **Creators fund depth** — Senior-authored interactive specs are the durable content engine, with a creator-favorable payout split.
