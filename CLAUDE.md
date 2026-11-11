# By-Design Labs website

The public site for By-Design Labs LLC (a Utah software company, one person: Grey). A Meteor + Blaze app, served from
the same Windows machine that runs Mechaclasm, at `by-design.dev`.

It has two jobs of equal weight:

1. **Be a finished, good-looking studio site**: landing page, what the lab does, a link to Mechaclasm, contact details.
2. **Teach Grey how component loading works.** Grey writes every component as an html + css + js trio and has always
   let Meteor decide how those get loaded. Here nothing is implicit: every file is loaded because another file imports
   it by name, and the reasons are written down in `docs/HowItLoads.md`.

**Read `docs/BUILD.md` before doing anything.** It holds the decisions already made, the phases, and what is still
unknown. Work one phase at a time and stop at the end of each for Grey to read and try it.

## Rules that hold in every session

- **Code style** is `/Users/grey/git/CODING_STYLE.md`, enforced by `/Users/grey/git/.eslintrc` (it applies to this
  folder by cascade). No semicolons, `if(`, `a=>a`, `{x, y}`, 2 spaces. Lint before calling a phase done:
  `/Users/grey/git/node_modules/.bin/eslint client imports lib server`.
- **ES modules only**: `import`/`export`, never `require`. Nothing on `window` or `global`. No `Session`.
- **A component is three files** in its own folder: `<name>.html`, `<name>.css`, `<name>.js`. The js is the only
  file anything else imports.
- **A file loads only because something imports it.** No eager-loaded folders, no central list of every component, no
  template looked up by a string built at runtime.
- **Comments** are sparse, lowercase, in Grey's voice. Never a capitalised summary of the next line, never emoji in
  logs, no leftover `console.log`.
- **Don't invent facts** about the business or Grey (dates, clients, skills, numbers). Copy lives in
  `imports/content/site.js`; anything unknown stays a clearly marked `TODO` there until Grey fills it in.
- **Explain as you go.** After each piece, say in a few plain sentences what it does and why it's wired that way,
  pointing at the files. When there's a real choice of approach, lay out the options with their costs before picking.
- **The server is shared with Mechaclasm.** Never edit, stop or restart anything of Mechaclasm's. You can't reach the
  server from here; anything that runs on it is a script plus a checklist for Grey.
- **Commits**: area first, then the change in plain English (`router: match trailing slashes`). Only when asked.
