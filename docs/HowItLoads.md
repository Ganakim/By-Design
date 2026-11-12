# How it loads

What happens between typing `by-design.dev` and seeing the page, file by file. Everything here was observed on this
machine with Meteor 3.6 (Rspack 2, `@meteorjs/rspack` 3.0), by driving headless Chrome over the DevTools protocol and
reading every response. Where something hasn't been observed yet it says so.

## The short version

- Every file loads because another file imports it. The chain starts at the two entries in `package.json`
  (`meteor.mainModule`), and nothing else runs.
- There are **two compilers side by side**. Rspack bundles the `.js` and `.css`. Meteor's own template compiler turns
  each `.html` into JavaScript. Rspack hands every `.html` it meets over to Meteor and keeps an empty stand-in.
- So a page's **js and css load on demand**, in their own small chunk, the first time it's visited, but **every
  template is sent with the first page load**, including pages not visited yet. They're small (a few hundred bytes
  each). Decided 2026-11-11: accept this rather than drop Rspack. The eager part is about 2.4 KB against Meteor's own
  ~120 KB.

## The import graph

Solid arrows are static imports, run before the importing file's body. Dashed arrows are `import()`, run only when the
router asks.

```
package.json  meteor.mainModule.client
   │
client/main.js
   ├── client/main.html          <head> only
   ├── client/main.css           reset
   ├── imports/layouts/site/site.js
   │      ├── site.html, site.css
   │      ├── lib/router.js
   │      │      ├── lib/match.js
   │      │      └── lib/routes.js
   │      │             ├┄┄▶ imports/pages/home/home.js          '/'
   │      │             │       ├── home.html, home.css
   │      │             │       ├── imports/content/site.js
   │      │             │       ├── imports/components/panel/panel.js
   │      │             │       ├── imports/components/action/action.js
   │      │             │       └── imports/components/status/status.js
   │      │             └┄┄▶ imports/pages/notFound/notFound.js   anything else
   │      │                     ├── notFound.html, notFound.css
   │      │                     ├── imports/content/site.js
   │      │                     └── imports/components/action/action.js
   │      ├── imports/components/backdrop/backdrop.js
   │      ├── imports/components/nav/nav.js
   │      │      ├── nav.html, nav.css
   │      │      └── imports/content/site.js
   │      └── imports/components/footer/footer.js
   │             ├── footer.html, footer.css
   │             ├── imports/content/site.js
   │             ├── lib/motion.js
   │             └── imports/components/switch/switch.js
   └── lib/router.js             (same module as above, runs once)

public/fonts/outfit.woff2        not imported: fetched by the browser when main.css asks for it

package.json  meteor.mainModule.server
   │
server/main.js                   empty
```

A module runs once, however many files import it. `site.js` and `main.js` both import the router and get the same
object, with the same `ReactiveVar` inside.

## One request, start to finish

### 1. nginx

Not observed yet. In Phase 5 the Windows machine's nginx will take the HTTPS request for `by-design.dev` and pass it
to Meteor on `127.0.0.1:8092`. Locally there's no nginx: `meteor run` listens on `localhost:3000` itself.

### 2. The Meteor server

`server/main.js` is the server entry and is empty. The server's job here is to serve files: the HTML shell, the
bundles and the chunks. It answers **every** path with the same shell, `/`, `/nowhere` and `/nowhere/` alike. That's
why a hard refresh on any address works: the browser always gets the app, and the app's router decides what to show.
(A real 404 status for unknown paths would need server code. It isn't needed now.)

There's no database. The `mongo` package was removed in Phase 0 and the server starts without `MONGO_URL`.

### 3. The HTML shell

Built by Meteor from `client/main.html`. Its `<head>` is copied in as it is. The `<body>` is empty because the layout
is rendered by JavaScript (step 6). In development the shell is:

```html
<head>
  <link href="/build-chunks/main.css" rel="stylesheet">
  <title>By-Design Labs</title>
  <meta name="viewport" ...>
</head>
<body>
  <script src="/packages/meteor.js?hash=…"></script>   ← 57 of these, one per Meteor package
  <script src="/app/global-imports.js?hash=…"></script>
  <script src="/app/app.js?hash=…"></script>
  <script src="/__rspack__/client-rspack.js"></script>
</body>
```

In production (`meteor run --production`) it collapses to one stylesheet and one script:

```html
<link href="/build-chunks/main.55773ed68a1ed0f2.css" rel="stylesheet">
<script src="/834c90f6d374c193af3f421a7fef0b920c8e082e.js?meteor_js_resource=true"></script>
```

The long names are content hashes. A changed file gets a new name, so browsers can cache these forever.

### 4. The bundle: two compilers

This is the part Meteor used to hide. Meteor now gives the app's js and css to **Rspack** (a webpack-style bundler)
and keeps the rest for itself:

| What | Who compiles it | Where it ends up (dev) |
| --- | --- | --- |
| Meteor packages (`meteor/blaze`, `meteor/reactive-var`, …) | Meteor | `/packages/*.js`, one file each |
| Every `.html` (templates and `main.html`'s head) | Meteor's template compiler | `/app/app.js` |
| Our `.js` | Rspack | `/__rspack__/client-rspack.js`, plus a chunk per `import()` |
| Our `.css` | Rspack | `/build-chunks/main.css`, plus a `.css` chunk per `import()` |

How the `.html` gets handed over: Rspack walks the imports from `client/main.js`, and each time it meets a `.html` it
leaves an empty module in its own output. Here is the home page's chunk, as served:

```js
"./imports/pages/home/home.html"() {
},
"./imports/pages/home/home.js"(…) {
  var _home_html = __webpack_require__("./imports/pages/home/home.html")   // the empty one
  var meteor_templating = __webpack_require__("meteor/templating")
  var _site = __webpack_require__("./imports/content/site.js")
  meteor_templating.Template.home.helpers(_site.pages.home)
  const __rspack_default_export = (meteor_templating.Template.home)
}
```

It also writes down every `.html` it met, **including the ones behind `import()`**, into a generated file,
`_build/main-dev/client-meteor.js`, which becomes Meteor's real client entry. Its first line is:

```js
module.link('../.././client/main.html');module.link('../.././imports/layouts/site/site.html');
module.link('../.././imports/components/nav/nav.html');module.link('../.././imports/components/footer/footer.html');
module.link('../.././imports/pages/home/home.html');module.link('../.././imports/pages/notFound/notFound.html');
```

`module.link` is Meteor's `import`. So Meteor compiles and runs every template up front. Then this file loads
Rspack's bundle, and our code takes over. `_build/` is regenerated on every build and is gitignored. You can read it,
but don't edit it.

The probe saw this on the first load of `/`:

| Request | Carries |
| --- | --- |
| `/app/app.js` (2.4 KB) | compiled templates: `site`, `nav`, `footer`, `home`, **`notFound`** |
| `/__rspack__/client-rspack.js` | `main.js`, `site.js`, `nav.js`, `footer.js`, the router, `content/site.js` |
| `imports_pages_home_home_js.js` (0.7 KB) | `home.js` |
| `imports_pages_home_home_js.css` (0.3 KB) | `home.css` |

and on clicking through to `/nowhere`, only two new requests: `notFound`'s js chunk and its css chunk. Going back to
`/` sent nothing: the home chunk was already loaded, and `import()` of a loaded module just hands it back.

In production the same split holds. All of `/packages/`, `app.js` and `client-rspack.js` are merged and minified
into the one hashed script (397 KB, 120 KB compressed, nearly all of it Meteor itself). Page chunks are still
separate: `973.<hash>.js/.css` is home and `213.<hash>.js/.css` is notFound, each fetched only when visited.

### 5. `client/main.js`

```js
import './main.html'
import './main.css'
import {Meteor} from 'meteor/meteor'
import {Blaze} from 'meteor/blaze'
import site from '/imports/layouts/site/site'
import Router from '/lib/router'

Meteor.startup(()=>{
  Blaze.render(site, document.body)
  Router.start()
})
```

All imports run first, top to bottom, each one's own imports before it. By the time the body runs, every template
on the page is registered and the router module exists. `Meteor.startup` waits for the DOM to be ready. Then the
layout is drawn into `<body>`, with an empty page slot, and the router is started.

### 6. The layout

`imports/layouts/site/site.js` imports its html and css, then the two components its template includes (`nav`,
`footer`), then the router. Its one helper:

```js
Template.site.helpers({page:Router.page})
```

and in `site.html`, `{{> page}}`. Blaze looks `page` up as a helper first. The helper returns a Template object, and
Blaze includes it. The helper reads a `ReactiveVar`, so when the router sets a new template, Tracker reruns the helper
and Blaze swaps the page. No template is looked up by a string, and there's no `Template.dynamic`.

### 7. The router

Three files with one job each:

- `lib/routes.js`: the table. `'/'` maps to `()=>import('/imports/pages/home/home')`. Writing the import inside a
  function is what makes it lazy. Rspack sees the path when it builds and makes a chunk for it, but the chunk isn't
  fetched until the function is called.
- `lib/match.js`: `match(table, path)` trims trailing slashes and does one lookup, O(1). It uses `Object.hasOwn`, so a
  path like `/constructor` isn't found on the object's prototype. It has no imports, so `npm test` runs it under plain
  Node.
- `lib/router.js`: owns the current page (a `ReactiveVar` nobody else can set) and does the browser side:
  - `start()` shows the current address and listens for back/forward (`popstate`) and for clicks.
  - A click is taken over only when it's a plain left-click on a same-origin link with no `target` or `download`.
    Anything else (new tab, external site, download, `#anchor` on the same page) goes to the browser as normal.
  - `go(path)` pushes the address and shows it.
  - `show(path)` matches, awaits the page's `import()`, and sets the page. If two navigations overlap, only the newer
    one is applied, so a slow chunk can't land on top of a later page.

### 8. A page arriving

`await import('/imports/pages/home/home')` makes Rspack's runtime fetch `…home_home_js.js` and `…home_home_js.css`.
The css arrives as a `<link rel="stylesheet">` that Rspack adds to `<head>`. Then `home.js` runs: its html import is
the empty stand-in, `Template.home` already exists from `app.js`, so it adds helpers and exports the template as its
default. The router stores it, and the layout redraws.

### 9. What a template becomes

`nav.html`:

```html
<template name="nav">
  <nav id="Nav">
    <a class="navHome" href="/">{{studio.name}}</a>
    {{#each link in nav}}
      <a class="navLink" href="{{link.href}}">{{link.label}}</a>
    {{/each}}
  </nav>
</template>
```

is compiled by Meteor into a module `template.nav.js` inside `app.js`:

```js
Template._migrateTemplate("nav", new Template("Template.nav", function(){
  var view = this
  return HTML.NAV({id:"Nav"},
    HTML.A({class:"navHome", href:"/"},
      Blaze.View("lookup:studio.name", ()=>Spacebars.mustache(Spacebars.dot(view.lookup("studio"), "name")))),
    Blaze.Each(()=>({_sequence:Spacebars.call(view.lookup("nav")), _variable:"link"}), ()=>[
      HTML.A({class:"navLink", href:()=>Spacebars.mustache(Spacebars.dot(view.lookup("link"), "href"))}, …)
    ]))
}))
```

(Shortened. The whitespace text nodes and the hot-reload block at the end are left out.) A template is a render
function that builds `HTML.*` objects. Every `{{…}}` becomes a `view.lookup` that Blaze can rerun on its own when
what it read changes. `_migrateTemplate` is what puts it on `Template.nav`, and it's also how hot reload swaps it.

### 10. The css

Each component's css is nested under its id. Rspack compiles it, and for the browsers Meteor targets it **flattens
the nesting**. `#Site{ #Main{flex: 1} }` is served in production as `#Site #Main{flex:1}`, and `padding-block` becomes
`padding-top` plus `padding-bottom`. Nesting is safe to use. What reaches the browser is plain css.

`client/main.css` is in the main stylesheet linked from the shell. A page's css is in its own chunk, linked when the
page first loads, and it stays linked after you navigate away. That's harmless while every rule is scoped to its own
id.

Oddity: the production stylesheet starts with a comment banner about `client-rspack.js` being empty. It's text from a
generated file that ends up in the css. It does nothing. It starts with `/*!`, the mark minifiers treat as "keep
this comment", which is likely why it survives.

### 11. The font, and `public/`

`public/` is the one folder that isn't part of the import graph. Meteor serves whatever is in it at the site's root,
untouched: `public/fonts/outfit.woff2` is `/fonts/outfit.woff2`. Nothing imports it. `main.css` has an `@font-face`
naming that address, and the browser fetches it the first time some text needs the font. It was observed coming back
as `font/woff2`, 32 KB. That one file holds every weight, from thin to bold, for Latin text. The licence that allows
serving it is beside it, in `OFL.txt`.

A component used several times on a page (`panel`, `action`, `status`, `switch`) can't scope its css under an id,
because an id must be unique. Those are scoped by a class with the component's name instead (`.panel{…}`). Components
used once (`#Nav`, `#Footer`, `#Backdrop`) and pages keep the id.

## While developing

Observed with `meteor run` and a page left open:

- Editing a `.html` swaps that template in place. The page doesn't reload.
- Editing any `.js` (a page, a component, the layout, `main.js`) reloads the whole page. The layout is never drawn
  twice.

## Add a component by hand

Say a `tagline` component inside the home page.

1. Make the folder `imports/components/tagline/` with three files.
2. `tagline.html`:
   ```html
   <template name="tagline">
     <p id="Tagline">{{text}}</p>
   </template>
   ```
3. `tagline.css`, everything nested under the id:
   ```css
   #Tagline{
     font-style: italic;
   }
   ```
4. Put the words in `imports/content/site.js`, e.g. `export const tagline = 'Made on purpose.'`
5. `tagline.js`, the front door. Its own html and css first, then what it needs, then the wiring:
   ```js
   import './tagline.html'
   import './tagline.css'
   import {Template} from 'meteor/templating'
   import {tagline} from '/imports/content/site'

   Template.tagline.helpers({text:tagline})
   ```
   A component that nothing imports by name doesn't need an export. Importing the file is what registers it.
6. In the parent: add `{{> tagline}}` to `home.html`, and `import '/imports/components/tagline/tagline'` to `home.js`.
7. Save and look. If the page says `No such template: tagline`, step 6's import is missing.

To remove it, undo step 6 and delete the folder. Nothing else refers to it.

Adding a page is the same, plus a line in `lib/routes.js`, and the page's js ends with `export default Template.<name>`.
