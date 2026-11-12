import {ReactiveVar} from 'meteor/reactive-var'
import {Tracker} from 'meteor/tracker'

// whether the page may move. starts from the visitor's choice if they made one, else from their system
const KEY = 'motion'

function saved(){
  try{return localStorage.getItem(KEY)}catch{return null}
}

const choice = saved()
const moving = new ReactiveVar(choice ? choice == 'on' : !matchMedia('(prefers-reduced-motion: reduce)').matches)

Tracker.autorun(()=>document.documentElement.classList.toggle('still', !moving.get()))

const Motion = {
  on: ()=>moving.get(),
  toggle(){
    moving.set(!moving.get())
    try{localStorage.setItem(KEY, moving.get() ? 'on' : 'off')}catch{/* storage blocked: the choice lasts this visit */}
  }
}

export default Motion
