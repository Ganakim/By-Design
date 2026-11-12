# By-Design Labs

The public site for By-Design Labs LLC, at `by-design.dev`. One landing page and a not-found page, built with Meteor 3
and Blaze, with no database.

## Run it

```sh
meteor npm install
meteor run                 # http://localhost:3000
meteor run --production    # the minified build, to check what's actually sent
npm test                   # the router's matching tests, plain node, no meteor
```

Lint with the shared config one folder up: `/Users/grey/git/node_modules/.bin/eslint client imports lib server`.

## Where things live

| Path | What |
| --- | --- |
| `client/main.js` | the only client entry: base css, the layout, the router |
| `client/main.html` | the `<head>`: title, description, link-preview tags, favicon |
| `client/main.css` | reset and every design token, light and dark |
| `imports/content/site.js` | all the copy and links. Edit text here, not in templates |
| `imports/layouts/site/` | header, page slot, footer |
| `imports/components/` | one folder per component: `name.html`, `name.css`, `name.js` |
| `imports/pages/` | `home` and `notFound`, each loaded only when visited |
| `lib/` | the route table, the router, and the theme and motion switches |
| `tests/` | `node --test` tests for route matching |
| `public/` | the font and favicon, served as-is |

Every file loads because something imports it; nothing is picked up by folder. `docs/HowItLoads.md` follows a request
from the address bar to the page and ends with how to add a component by hand. `docs/BUILD.md` records the decisions
behind the build.
