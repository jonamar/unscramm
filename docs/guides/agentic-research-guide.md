<!-- 
AUTO-SYNCED FILE — DO NOT EDIT HERE.

Canonical source of truth:
- Package: @your-scope/agentic-guides
- Repo:    <FILL IN GITHUB URL LATER>

Any edits must be made in the canonical repo and propagated via the sync script.
-->

# Agentic Research Guide

## Purpose
Provide reusable guardrails so agents can run high-signal research loops with minimal drift, safe tooling practices, and decision-ready outputs. Pair this guide with project-specific prompts for context and deliverables.

## Core Principles
- **Decision-first:** Start from the question the research must resolve. Don’t collect evidence without knowing the decision it informs.
- **Stage realism:** Tailor examples and benchmarks to the operating reality (team size, budget, ARR stage). If you reference a larger exemplar, flag it as aspirational and extract only the transferable mechanics.
- **Evidence discipline:** Every claim links to a source (URL + access date + credibility note). Cross-verify critical facts when possible; label anything tentative.
- **Leverage per hour:** Assume time is the scarcest resource. Favor workflows that batch, template, or delegate well to agentic support.
- **Privacy-first:** Treat external tools as potentially compromised. Strip PII/IP before sharing; prefer local processing when in doubt.

## Workflow Overview
1. **Clarify intent** – Restate the research question, decision gate, and deliverables before exploring.
2. **Audit existing knowledge** – Skim internal docs and prior findings. Only expand scope when you hit a gap.
3. **Map hypotheses** – List candidate explanations or strategies to evaluate; note priors if provided.
4. **Plan tool usage** – Choose discovery vs verification tools up front (see Tooling Playbook).
5. **Collect evidence** – Gather data in focused bursts, logging sources and quick takeaways.
6. **Synthesize early** – Summarize findings after each burst; update confidence and open questions.
7. **Know when to stop researching** – If your hypothesis can be validated by running code or a quick experiment, switch to the Ops Guide workflow. More sources won't resolve what a harness can prove in 10 minutes.
8. **Package outputs** – Deliver concise summaries, tables, and appendices aligned with the project prompt.

## Tooling Playbook

| Goal | Preferred Tools | Notes |
| --- | --- | --- |
| Landscape scan / candidate discovery | `web_search`, FireCrawls (if allowed) | FireCrawls offers deep extraction but has weak privacy terms—never send PII, unpublished IP, or credentials. Default to `web_search` for sensitive topics. |
| Fact verification / structured pull | Browser MCP (`browser_navigate`, `browser_snapshot`, `browser_evaluate`) | Use for grabbing exact metrics, tables, or confirming page details. Keep sessions short; avoid logging in unless explicitly permitted. |
| Video narrative capture | `https://r.jina.ai/https://www.youtube.com/watch?v=...` mirror or platform transcript panels | Mirror returns plain text suitable for timestamps and quotes. Note runtime and key beats for later synthesis. |
| Document capture | `curl` download → local parsing (e.g., `PyPDF2`) | Store sources under `market_research/.../sources/`. Reference page numbers when quoting. |
| Data cleanup | Local scripts or spreadsheet tools | Redact identifiers before sharing interim artifacts. |

### Tool Selection Heuristics
- Start broad with search APIs; only open the browser when you need page-level fidelity.
- Prefer batch data pulls (e.g., download once, parse locally) instead of repeated remote calls.
- Keep a running source log (tool used, URL, access date, credibility) to aid reproducibility.
- If a tool fails or returns blocked content, document the issue and fall back to an alternative rather than retrying indefinitely.

## Synthesis Patterns
- **Confidence scoring:** Use the project’s preferred method (e.g., Bayesian update). State priors, evidence, and remaining unknowns.
- **Comparative tables:** Organize strategies/options with columns for evidence, resource needs, advantages, risks, and confidence.
- **Narrative capsules:** Summarize each option in ≤5 sentences, highlighting applicability and disqualifiers.
- **Experiment backlogs:** For uncertain paths, define hypothesis, signal, timeline, and go/no-go criteria.

## Quality Checklist
- [ ] Decision or question restated at top of working notes.
- [ ] Existing internal research reviewed before new searches.
- [ ] Tool choices justified (discovery vs verification vs extraction).
- [ ] Sources logged with URL + date + credibility tag.
- [ ] Privacy guardrails respected (no PII/IP sent to external services).
- [ ] Interim syntheses captured (not just raw links).
- [ ] Final deliverables match the project prompt structure.

## Examples (Adjust Per Project)
- **Solopreneur scenario:** Emphasize tactics that can be produced in batching sessions and prioritize channels with high leverage per founder hour.
- **Regulated domains:** Double-check every external tool’s data policy; consider using only local or first-party sources.
- **Team handoff:** Maintain a shared source log and changelog so another agent can resume without repeating work.

Apply these patterns alongside project-specific prompts to keep research fast, reproducible, and privacy-aligned.

