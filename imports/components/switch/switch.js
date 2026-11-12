import './switch.html'
import './switch.css'
import {Template} from 'meteor/templating'

// the parent passes `on` (a value) and `toggle` (a function), so the switch owns no state of its own
Template.switch.events({'click .switch'(){this.toggle()}})
