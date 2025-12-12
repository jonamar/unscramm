<!-- 
AUTO-SYNCED FILE — DO NOT EDIT HERE.

Canonical source of truth:
- Package: @your-scope/agentic-guides
- Repo:    <FILL IN GITHUB URL LATER>

Any edits must be made in the canonical repo and propagated via the sync script.
-->

🧭 Agentic Docs Guide v1.1

A standard for high-signal, low-slop documentation in agentic workflows

⸻

1. Purpose

This guide exists to raise the document quality bar across human-AI collaboration.
It’s not about producing more text — it’s about clarity, alignment, and velocity.

Documents are the memory substrate of multi-agent systems. Every paragraph compounds future reasoning, scope clarity, and decision-making.
Every word is a trade-off between speed now and confusion later.

Success = fewer, sharper, reusable docs that strengthen shared purpose.

Target ratio: every 100 words should deliver one actionable idea or decision.

⸻

2. Core Principles of Agentic Documentation
	1.	Every Document Has a Function
→ Define what decision, alignment, or behavior this doc enables. If that isn’t clear, don’t write it yet.
	2.	Structure Clarifies Thought
→ Use tight section constraints (intent, length) instead of long instructions.
	3.	Each Doc Inherits and Passes Context
→ It’s a live node in a larger reasoning graph. Reference upstream and downstream artifacts.
	4.	AI Writes, Humans (and AIs) Align
→ Quality scales through self-evaluation, not manual review. Embed reflection prompts, not reviewers.
	5.	Don’t Teach the AI to Be Human
→ Avoid skill instruction (e.g., how to code). Focus on architecture, rationale, and decision context.
	6.	Every Organization Speaks Its Own Dialect
→ Tone, ethics, and priorities must be explicit and portable between docs.
	7.	Diagnose Before Rewriting
→ Don’t polish slop. Identify verbosity, repetition, or drift before editing.
	8.	Volume ≠ Value
→ High output with low signal-to-noise ratio is a systemic failure. Each word must earn its place.

⸻

3. Common Failure Modes

Typical breakdowns: verbosity, context drift, instruction instead of rationale, lost values, and over-production.
Each stems from forgetting the doc’s function.

Example:

Overwritten project intros that restate the same three goals in different phrasing.
→ Collapse them into one clear “purpose” line.

⸻

4. Standard Doc Anatomy
	1.	Purpose – What this doc exists to change or align.
	2.	Scope & Relationship – Where it fits in the project trajectory.
	3.	Key Principles / Constraints – Ethics, limits, and priorities.
	4.	Structure & Decisions – Core choices and rationale.
	5.	Dependencies / Related Docs – Upstream and downstream links.
	6.	Evaluation Criteria – How to judge clarity, brevity, and alignment.
	7.	Cross-Reference Index (for doc-heavy projects) – Task → Doc lookup, Problem → Solution mapping.

Each section should fit on one screen. If more is needed, spawn a child doc.

⸻

5. Doc Diagnostic Loop

Before marking a doc "ready," the agent should self-ask:
	1.	Is this decision-enabling?
	2.	Does it reuse and pass context?
	3.	Is it shorter than it could be?
	4.	Does it reflect shared principles?
	5.	Can a new agent act on it without more input?

If any answer is "no," revise or remove.

### When to Run Diagnostic Loop

Run this check:
- Before marking any doc "ready"
- After any edit >50 words
- When another doc references this one
- During monthly review of high-traffic docs

### Evaluation Checklist for Technical Docs

```markdown
<!-- EVALUATION CHECKLIST:
- [ ] Can an agent find what it needs via grep in <30 seconds?
- [ ] Is every command copy-paste ready?
- [ ] Are credentials clearly marked and located?
- [ ] Does this enable a decision without reading other docs?
- [ ] Is there duplicate content that should be referenced instead?
- [ ] Does the same concept appear >1 time in THIS doc? (run grep test)
- [ ] If this is a hint doc, am I pointing to canonical sources vs repeating them?
-->
```

⸻

6. Inline Comment Template

# [Title] — vX.X (Agentic Docs)
<!-- Purpose: one sentence on decision/alignment -->
<!-- Context: prior docs or dependencies -->
<!-- Key principles/constraints: 3 bullets max -->
<!-- CANONICAL: concept-name (if this is the single source of truth) -->
<!-- Core content: decisions, rationale -->
<!-- Evaluation: brevity, clarity, alignment -->

This compact form keeps docs uniform, self-describing, and easily parsed by agents.

**Doc Type Signals:**
- Add `CANONICAL: concept-name` if this doc owns the full explanation
- Hint docs (like CLAUDE.md) should reference canonical sources, not repeat them
- One concept = one canonical location (grep to verify)

### Required Metadata for Service Docs

For technical service documentation, include structured metadata:

```markdown
<!-- 
SERVICE: [service-name]
CONTAINERS: [container-list]
NETWORKS: [network-list]
DEPENDS_ON: [dependencies or "None"]
LAST_UPDATED: YYYY-MM-DD
RELATED_DOCS: [doc1.md], [doc2.md]
-->
```

Optional fields:
- `EXPOSES:` Port numbers and visibility (internal/external)
- `DATA_VOLUMES:` Volume names or paths
- `BACKUP:` Backup strategy summary

⸻

7. Alignment Hooks

Use these prompts to check alignment across principles:
	•	Privacy: Does this design respect data sovereignty and minimal retention?
	•	Accessibility: Is it clear and inclusive to diverse readers (including screen readers, multilingual agents)?
	•	Voice: Does it sound like us — consistent in tone, ethics, and rationale?

⸻

8. Example: Refactoring a Verbose Doc

Before:

The system is designed in such a way that users are able to sign up and log in securely using encryption technologies that ensure data is protected from unauthorized access.

After:

Users authenticate via end-to-end encryption; credentials never leave their device.

Impact: –70 % words, +200 % clarity.

⸻

9. Meta-Guidance

When revising this guide or any doc:
	•	Remove repetition.
	•	Prefer brevity that clarifies, not minimalism that obscures.
	•	Examples ground meaning — keep one per concept.
	•	Duplication isn’t emphasis; it’s dilution.

⸻

10. Real-World Patterns

These patterns emerge from production documentation:

### Pattern: Command Reference Tables

Instead of subsections per command:
```markdown
### View Logs
```bash
ssh server "docker logs service"
```

### Restart Service
```bash
ssh server "docker restart service"
```
```

Use tables:
```markdown
| Task | Command |
|------|----------|
| View logs | `ssh server "docker logs service"` |
| Restart | `ssh server "docker restart service"` |
```

Impact: -50% words, +100% scannability.

### Pattern: Cross-Reference Document

For projects with >10 docs, create a lookup index:

```markdown
# Cross-Reference Guide

| I want to... | Primary Doc | Also See |
|--------------|-------------|----------|
| Understand system | README.md | ARCHITECTURE.md |
| Find a command | QUICK-REFERENCE.md | Service docs |
| Debug service X | X-SETUP.md §Troubleshooting | SERVICES-MAP.md |
```

This prevents agents from reading every doc to find the right one.

### Pattern: Single Source of Truth

Every concept needs exactly one canonical home. Other docs reference it.

**Doc type roles:**
- **Canonical docs** (ZERO_KNOWLEDGE.md, QUICK-REFERENCE.md): Full explanations
- **Hint docs** (CLAUDE.md, DOC-MAP.md): Point to canonical sources, max 1 mention
- **Operational docs** (guides/): Can repeat concepts when pedagogically necessary

**In practice:**
```markdown
<!-- Canonical doc header -->
<!-- CANONICAL: EU data sovereignty -->

<!-- Hint doc (CLAUDE.md) - references only -->
KEY_PRINCIPLES:
- EU sovereignty <!-- See ZERO_KNOWLEDGE.md -->

<!-- Other docs - reference instead of duplicating -->
**Database Credentials:** See QUICK-REFERENCE.md#database-credentials
```

**Grep test:** If a concept appears >2 times in non-operational docs, consolidate.

Duplication isn't emphasis; it's dilution.

### Pattern: Grep Before You Write

Before documenting a principle or concept, check if it already exists:

```bash
# Check existing mentions
grep -ri "data sovereignty" . --include="*.md" | wc -l

# If >2 results: find canonical source
grep -ri "data sovereignty" . --include="*.md"
```

**Decision tree:**
- 0 mentions → You're creating the canonical source
- 1-2 mentions → Review those docs, reference if appropriate
- 3+ mentions → Duplication detected, consolidate before adding more

This turns "don't repeat yourself" into a concrete pre-write workflow.

### Pattern: Reflection Prompts

Embed self-check questions in doc templates:

```markdown
## Before You Edit This Doc
- Is this change adding clarity or just adding words?
- Can I express this in half the words?
- Does this duplicate information from another doc?
- Will an agent understand this faster after my change?
```

⸻

11. Closing

Documents don’t record work — they define intention.
They are the architecture of alignment.

Every clean, aligned document compounds understanding across agents.
Every unnecessary word dilutes it.
