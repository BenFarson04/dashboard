// Central service registry.
// The UI imports data services from here, so switching a domain from mock to live
// only touches the corresponding *Service.js file — never the components.
import * as calendar from './calendarService'
import * as email from './emailService'
import * as news from './newsService'
import * as weather from './weatherService'
import { generateBriefing } from './briefingService'

export { calendar, email, news, weather, generateBriefing }
