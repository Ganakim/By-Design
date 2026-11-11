import './nav.html'
import './nav.css'
import {Template} from 'meteor/templating'
import {studio, nav} from '/imports/content/site'

Template.nav.helpers({studio, nav})
