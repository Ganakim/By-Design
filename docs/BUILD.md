# Building the By-Design Labs site

Instructions for the model building this out, and a record for Grey of what was decided and why.

## 1. What this is

By-Design Labs LLC is Grey's Utah software company, registered some years ago and never given a website. Grey builds
games, web apps and tools: Mechaclasm (a multiplayer Unity game with its own backend) is the main current project, and
there are client sites, Discord bots and experiments behind it.

The site is a **studio home**: it says who the lab is and what it makes, points at Mechaclasm, and tells people how to
get in touch. It is not a sales page and not a résumé.

It is also a **learning project**. Grey's own words: write it "like my next step in my programming career". Grey has a
settled way of working (each component as separate html, css and js files) and wants to keep it, but has always
"relied on the black box" to get those files loaded. The build should leave Grey able to explain, for any file in the
project, what causes it to load, when, and what the build tool did to it on the way.

## 2. Decisions already made (don't reopen without a reason)

| Decision | Choice |
| --- | --- |
| Framework | MeteorJS with Blaze templates |
| Loading | Blaze kept, but wired explicitly: named imports, no globals, pages imported on demand, and a written walkthrough of what the build does |
| Purpose | Studio home |
| Project showcase | None yet. Mechaclasm gets a link. Leave room to add one later, build nothing for it now |
| Contact | A visible email address and profile links. No form, no database |
| Hosting | The Windows machine that runs Mechaclasm, behind its nginx |

## 3. What Grey does today, and the step up

Read one of Grey's existing sites first so the new code is recognisably theirs:
`/Users/grey/git/Web/UtahStemAndArtsAcademy` (latest) and `/Users/grey/git/commonFiles/templateWithRouting` (their
starter). The component layout carries over unchanged. These habits change, and each change is a thing to explain:

| Today | Here | Why |
| --- | --- | --- |
| `client/main.js` requires every component and page in one long list | Each parent imports the children its own template includes | The import graph matches the template tree, so a missing import fails in one obvious place, and a deleted component leaves nothing behind |
| `require(...)`, and `Tools`, `Router`, collections put on `global` | `import`/`export`; a file's dependencies are all at its top | You can read what a file needs without knowing what ran earlier |
| The page is a name in `Session`, rendered with `Template.dynamic` from a joined string | A route table whose entries hold `()=>import(...)`; the page module hands back its template | No lookup by a string that might not match; a page's code isn't sent until it's visited |
| `Session` for state | A `ReactiveVar` owned by the one module responsible for it | One owner per fact |
| `setInterval` polling until something is ready | Promises (`await import(...)`) and Tracker | No timers guessing at readiness |
| `'click a'` on body calling `preventDefault` for every link | Only same-origin, plain left-clicks are taken over | External links, new-tab clicks and downloads keep working |
| A hand-rolled regex router covering params and queries | A router that does only what this site's routes need | Small enough to read in one sitting |
| Bootstrap or Tailwind plus Web Awesome from a CDN | Hand-written CSS with design tokens and native nesting | Nothing styling the page that Grey didn't write; nesting keeps the SCSS habit without a compiler |

## 4. The wiring rules

These are the heart of the project. If one turns out not to work with the toolchain, stop and tell Grey rather than
quietly working around it.

1. **One entry per side.** `package.json`'s `meteor.mainModule` names `client/main.js` and `server/main.js`. Nothing
   else runs unless reached from there by imports.
2. **The js is a component's front door.** `nav.js` imports `./nav.html` then `./nav.css`, then registers helpers,
   events and lifecycle hooks. Nothing outside the folder imports its html or css.
3. **Parents import their children.** If `site.html` has `{{> footer}}`, `site.js` has
   `import '/imports/components/footer/footer'`. `client/main.js` imports only the stylesheet base, the layout and the
   router.
4. **Pages load on demand.** The route table maps a path to a function that dynamically imports the page module. The
   page module's default export is its template. The router awaits the import and stores the template in a
   `ReactiveVar`; the layout renders whatever is there. (Blaze can include a template returned by a helper,
   `{{> page}}`; confirm this, and use it instead of `Template.dynamic` with a name.)
5. **No shared grab-bag.** No `Tools` object, no global helpers registered "in case". A helper lives with the
   component that uses it; if two need it, it becomes a small named module both import.
6. **Copy is data.** All text, links and contact details live in `imports/content/site.js`. Templates read from it
   through helpers. One place to edit, and the place a showcase's project list would later go.
7. **Route matching stays simple.** Today's routes are fixed paths, so the table is a plain object and a match is one
   lookup, O(1). Don't add params, queries or wildcards until a page needs them.

## 5. Shape of the project

```
client/main.html        head (title, meta, icons) and an empty body mount
client/main.js          the entry: base css, layout, start the router
client/main.css         reset and design tokens only
imports/layouts/site/   header, page slot, footer
imports/components/     nav, footer, and whatever the page sections need
imports/pages/home/     the landing page
imports/pages/notFound/ shown for any unknown path
imports/content/site.js all copy and links
lib/routes.js           the route table
lib/router.js           matching (pure), then navigation and link handling
server/main.js          as close to empty as it can be
deploy/                 scripts and nginx config for the Windows machine
docs/HowItLoads.md      the walkthrough, written as the build goes
```

Ids are `PascalCase` (`#Nav`), classes `camelCase`, and each component's css is nested under its own id so nothing
leaks:

```css
#Nav{
  display: flex;
  .navLink{
    color: var(--text-dim);
    &:hover{color: var(--text);}
  }
}
```

## 6. The toolchain, as checked on this machine (2026-11-11)

- Meteor **3.5** is installed; its Node is **24.15.0** (`meteor node -v`).
- `meteor create --blaze <path>` gives: `blaze-html-templates`, `jquery`, `reactive-var`, `tracker`, `mongo`,
  `hot-module-replacement`, `blaze-hot`, the two minifiers, `typescript`, `mobile-experience`, and **`rspack`**, with
  `"modern": true` and an `rspack.config.js`. `mainModule` is already set.
- **Rspack matters for this project.** Meteor now bundles app code with Rspack, but Blaze `.html` files are left out
  of it: `@meteorjs/rspack` marks them external (`ignore-loader`, and `isEagerImport` for anything ending `.html`) and
  Meteor's own template compiler handles them. So there are two pipelines side by side, and a template may be sent up
  front even when the js that imports it is loaded on demand. **This is not confirmed either way.** Phase 1 has an
  experiment to find out. Whatever is observed goes in `docs/HowItLoads.md`; nothing goes in that isn't observed.
- Not checked: whether `meteor create` accepts a folder that already has files (this one has `CLAUDE.md`, `docs/` and
  `.git`). If it refuses, create it in a temporary folder and move the files in.
- Not checked: whether the css minifier and Rspack pass native CSS nesting through untouched in a production build.
  Check with `meteor run --production` before relying on it. Nesting is supported by every current browser; if the
  build mangles it, tell Grey and offer SCSS as the fallback.
- Not checked: whether the server starts with the `mongo` package removed and no `MONGO_URL`. The `--minimal`
  skeleton has no `mongo`, so it should. The site has no data, so the aim is no database at all.

## 7. Phases

Stop at the end of each phase. Tell Grey what now exists, how to see it, and what to read. Don't start the next phase
until Grey says so.

### Phase 0: scaffold

- `meteor create --blaze` into this folder, then strip the sample (the `hello` and `info` templates, the counter).
- Remove packages the site has no use for, one at a time, running the app after each: `mongo`, `mobile-experience`,
  `typescript`, and `jquery` if Blaze still runs without it. Say what each did and why it's gone or staying.
- Make the first commit only if Grey asks.

**Done when** an empty page is served by `meteor run` with no errors in either console, and Grey has a short list of
which packages remain and what each is for.

### Phase 1: the wiring

Build the skeleton with no design at all: the entry, the layout, `nav` and `footer` as stubs, the router, `home` and
`notFound` pages holding a heading each, and the content module.

Then run the experiment and write `docs/HowItLoads.md` from what it shows:

- With the browser's network tab open, load `/`, then navigate to an unknown path. Which requests carry `home`'s js,
  html and css? Which carry `notFound`'s? Is anything of `notFound` sent before it's visited?
- Compare `meteor run` with `meteor run --production`.
- Look at what a template becomes: find the compiled output for one `.html` and show how
  `<template name="nav">` turns into `Template.nav`. Find how an imported `.css` reaches the page.

`docs/HowItLoads.md` is written for Grey, who knows Meteor from the outside. It follows one request from the address
bar to pixels: nginx, the Meteor server, the html shell, the bundle, `client/main.js`, the layout, the router, a page
import, the template registering itself, the css arriving. For each step: which file, what triggers it, what the
build did to it. Include a diagram of the import graph. End with "add a component by hand": the exact steps, so Grey
can do it without help. Suggest Grey adds one that way before Phase 2.

If templates turn out to be sent eagerly under Rspack, that is a finding, not a failure. Report it with the options
(accept it and document it; drop the `rspack` package for Meteor's classic bundler; other), with the cost of each,
and let Grey choose.

Give the router's matching function a few tests that run with `node --test` and need no Meteor: known path, unknown
path, trailing slash.

**Done when** both pages render through the router, back and forward work, a hard refresh on any path works, and
`docs/HowItLoads.md` describes what was actually observed.

### Phase 2: design

There is no logo, palette or brand yet. Propose a direction to Grey before building it: two or three options in
words (mood, type, colour), with a recommendation. Things to work from:

- The name. "By design" means on purpose: deliberate, considered, engineered. A lab is where things get tried.
- Mechaclasm's look (`/Users/grey/git/Unity/Geometry/Docs/Theme.md`: matte graphite, polished steel, a rare line of
  heat) shows Grey's taste. The lab is the parent, so it can be kin to that without copying it.
- Restraint. A studio page with little content reads best when it is confident and quiet. A text wordmark is fine.

Constraints:

- Every colour, size and space is a custom property in `client/main.css`, named for what it means, not what it looks
  like. Components use tokens, never raw values.
- Light and dark, following the visitor's system setting.
- Works from 320px wide up. No horizontal scroll.
- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1`, visible focus, text contrast of at least 4.5:1,
  motion off under `prefers-reduced-motion`.
- No CSS framework, no icon kit, no CDN scripts. The few icons needed are inline SVG. A web font, if used, is one
  family, served from `public/`.

**Done when** the landing page is designed at phone and desktop widths in both themes, with placeholder copy.

### Phase 3: content

The landing page, top to bottom:

1. **Hero**: the name and one line saying what the lab is.
2. **What the lab makes**: two or three short items. Games, web apps and tools are supported by the projects on this
   machine; the wording is Grey's to approve.
3. **Mechaclasm**: named as the current project, a sentence about it, a link to `https://mechaclasm.by-design.dev`.
   Ask Grey whether that site is ready for visitors before linking.
4. **About**: a short paragraph on who is behind the lab.
5. **Contact**: an email link and profile links.
6. **Footer**: "By-Design Labs LLC", Utah, the year.

Draft the copy, then go through it with Grey. Ask, don't guess, for:

- The public contact email (not Grey's personal address unless they say so).
- The name to show, and how much personal detail they want.
- Which profiles to link. GitHub is `github.com/Ganakim`; confirm it. Ask about Discord and anything else.
- Anything stating a year, a client, or a number.

Also in this phase: the page title, meta description, Open Graph tags, a favicon and `theme-color`, all in
`client/main.html` so link previews get them without running any js. The body is rendered in the browser; say so to
Grey, and that server rendering is the answer if search results ever matter more.

**Done when** no `TODO` is left in `imports/content/site.js` and Grey has approved every line.

### Phase 4: finish

- Lint clean. Router tests pass.
- Keyboard through the whole page. Check contrast in both themes.
- `meteor run --production`: confirm the css survived, look at what is sent and how large it is, and note both in
  `docs/HowItLoads.md`.
- A `README.md` for the repo: what it is, how to run it, where things live. Short.

### Phase 5: deploy

You can't reach the server. This phase produces scripts, a config file and a checklist; Grey runs them. Nothing here
may change anything of Mechaclasm's.

What is known, from `/Users/grey/git/Unity/Geometry/Server/Deploy/` (read `setup.ps1`, `deploy.ps1` and
`nginx-mechaclasm.conf` and follow their pattern and tone):

- A Windows machine. Mechaclasm lives in `D:\Mechaclasm` as two Windows services on `localhost:8090` and
  `localhost:8091`.
- The machine's nginx terminates HTTPS and proxies by host name. Mechaclasm's config speaks of a `*.by-design.dev`
  wildcard certificate.
- DNS for `by-design.dev` goes through Cloudflare.
- Mechaclasm deploys on every push to `main` through a GitHub Actions runner on the machine itself
  (`runs-on: [self-hosted, windows]`).
- Mechaclasm's repo is `github.com/Ganakim/Mechaclasm`.

Proposed, for Grey to confirm: the site at `by-design.dev` (with `www` redirecting to it), files in `D:\ByDesign`,
listening on `127.0.0.1:8092`.

To deliver in `deploy/`:

- `nginx-bydesign.conf`: its own `server` block. Websocket upgrade headers are needed (Meteor's connection to the
  browser), reusing the `map` Mechaclasm's config already defines rather than declaring it twice.
- `setup.ps1`: run once. Makes the folder and registers the site to start with Windows.
- `deploy.ps1`: swaps a new build in and restarts it.
- `.github/workflows/build.yml`, if Grey wants push-to-deploy here too.
- A checklist in `deploy/README.md` in the order Grey should do things, with how to check each step worked and how
  to undo it.

How a Meteor app gets there: `meteor build` produces a plain Node app. It needs Node of the same major version as
`meteor node -v` on the server, `npm install` run inside `bundle/programs/server`, and these environment variables:
`ROOT_URL=https://by-design.dev`, `PORT=8092`, `BIND_IP=127.0.0.1`, and no `MONGO_URL` if `mongo` was removed in
Phase 0.

Open questions. Raise each with Grey, with options and a recommendation, before writing the script that depends on it:

1. **The certificate.** A `*.by-design.dev` wildcard does not cover `by-design.dev` itself. Does the certificate also
   name the bare domain? If not: reissue it with both names, or use `www.by-design.dev` as the real address.
2. **Running Node as a Windows service.** Mechaclasm's services are .NET programs that speak the service protocol;
   `node.exe` doesn't, so `New-Service` alone won't work. The usual answers are a small wrapper (WinSW or NSSM) or a
   scheduled task at startup.
3. **Where the build happens.** On the server (needs Meteor installed there) or elsewhere with
   `meteor build --architecture os.windows.x86_64` and only Node on the server.
4. **The runner.** A self-hosted runner registered to the Mechaclasm repo won't pick up jobs from a new repo. Is it
   registered to the repo or the account?
5. **The repo.** Its name and whether it is public.
6. **Cloudflare.** Whether the proxy is on for the bare domain, and whether its email-address obfuscation should
   cover the contact link.

**Done when** Grey has run the checklist and `https://by-design.dev` serves the site, with Mechaclasm's two addresses
still answering as before.

## 8. Not now

Each of these was considered and left out. Don't build towards them.

- A project showcase or per-project pages.
- A contact form, accounts, a database, analytics.
- Server-side rendering.
- A blog.
