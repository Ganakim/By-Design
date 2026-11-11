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
