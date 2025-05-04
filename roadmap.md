
unordered backlog (out of scope of phase 1)
- a simple way to gather suggestions or feedback in the app. mvp: a link to github issues page.
- some simple gamification mechanisms (ex count of total animations run and total custom words. a history of word usage. later: something like an average word difficulty score to track spelling improvements over time) 
    - could be used as a KPI to track app success
- light mode
• For performance, consider dynamic imports for heavy modules (e.g. Framer Motion) so they’re code-split on demand.
Minor suggestions
• If you’re comfortable with the new App Router (Next.js 13+), you may eventually migrate to /src/app/… for nested layouts and server components, but your current “pages” approach is perfectly valid.
• Add an API route (e.g. /src/pages/api/word-pairs.ts) so swapping to a remote service can be as easy as pointing your client to /api/word-pairs.
• Verify your tsconfig.json has baseUrl: "src" and any path aliases you need.
- CI improvements: Later (once you push), we can add a 5.1 GitHub Actions file to run the same scripts on every PR.


notes to self:
- currently working on task 3 (3.5 next)
- before you work on step 4 make sure to expand it. (or at least check if it's expanded)