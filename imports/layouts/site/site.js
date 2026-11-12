import './site.html'
import './site.css'
import {Template} from 'meteor/templating'
import Router from '/lib/router'
import '/imports/components/backdrop/backdrop'
import '/imports/components/nav/nav'
import '/imports/components/footer/footer'

// {{> page}} includes whatever template the router last loaded
Template.site.helpers({page:Router.page})

export default Template.site
