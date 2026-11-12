import {ReactiveVar} from 'meteor/reactive-var'
import {Tracker} from 'meteor/tracker'

// light or dark. starts from the visitor's choice if they made one, else from their system.
// the css already follows the system on its own; this only pins it once there's a class on <html>
const KEY = 'theme'

function saved(){
  try{return localStorage.getItem(KEY)}catch{return null}
}

const choice = saved()
const dark = new ReactiveVar(choice ? choice == 'dark' : matchMedia('(prefers-color-scheme: dark)').matches)

Tracker.autorun(()=>{
  const root = document.documentElement
  root.classList.toggle('dark', dark.get())
  root.classList.toggle('light', !dark.get())
})

const Theme = {
  dark: ()=>dark.get(),
  toggle(){
    dark.set(!dark.get())
    try{localStorage.setItem(KEY, dark.get() ? 'dark' : 'light')}catch{/* storage blocked: the choice lasts this visit */}
  }
}

export default Theme
