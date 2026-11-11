import './home.html'
import './home.css'
import {Template} from 'meteor/templating'
import {pages} from '/imports/content/site'

Template.home.helpers(pages.home)

export default Template.home
