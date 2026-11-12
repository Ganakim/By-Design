import './home.html'
import './home.css'
import {Template} from 'meteor/templating'
import {pages} from '/imports/content/site'
import '/imports/components/panel/panel'
import '/imports/components/action/action'
import '/imports/components/status/status'

Template.home.helpers(pages.home)

export default Template.home
