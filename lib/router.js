import {ReactiveVar} from 'meteor/reactive-var'
import {Tracker} from 'meteor/tracker'
import {routes, notFound} from './routes'
import match from './match'

const page = new ReactiveVar(null)
// a slow import mustn't land on top of a newer one
let latest = 0

async function show(path){
  const key = match(routes, path)
  const ticket = ++latest
  const {default:template} = await (key ? routes[key] : notFound)()
  if(ticket != latest) return
  page.set(template)
  // the section a #hash names only exists once the page has drawn
  if(location.hash) Tracker.afterFlush(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView())
}

// only plain left-clicks on same-origin links are ours; everything else the browser handles
function onClick(e){
  if(e.defaultPrevented || e.button != 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const link = e.target.closest('a[href]')
  if(!link || (link.target && link.target != '_self') || link.hasAttribute('download')) return
  const url = new URL(link.href)
  if(url.origin != location.origin) return
  if(url.pathname == location.pathname && url.hash) return
  e.preventDefault()
  Router.go(url.pathname + url.search + url.hash)
}

const Router = {
  page: ()=>page.get(),
  go(path){
    if(path == location.pathname + location.search + location.hash) return
    history.pushState(null, '', path)
    window.scrollTo(0, 0)
    show(location.pathname)
  },
  start(){
    addEventListener('popstate', ()=>show(location.pathname))
    document.addEventListener('click', onClick)
    show(location.pathname)
  }
}

export default Router
