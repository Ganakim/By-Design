import './footer.html'
import './footer.css'
import {Template} from 'meteor/templating'
import {studio} from '/imports/content/site'
import Motion from '/lib/motion'
import '/imports/components/switch/switch'

Template.footer.helpers({
  studio,
  year: ()=>new Date().getFullYear(),
  moving: Motion.on,
  toggleMotion: ()=>Motion.toggle
})
