import './footer.html'
import './footer.css'
import {Template} from 'meteor/templating'
import {studio} from '/imports/content/site'

Template.footer.helpers({
  studio,
  year: ()=>new Date().getFullYear()
})
