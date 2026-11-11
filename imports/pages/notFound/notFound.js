import './notFound.html'
import './notFound.css'
import {Template} from 'meteor/templating'
import {pages} from '/imports/content/site'

Template.notFound.helpers(pages.notFound)

export default Template.notFound
