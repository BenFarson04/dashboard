// Central service registry.
// The UI imports data services from here, so switching a domain from mock to live
// only touches the corresponding *Service.js file — never the components.
import * as calendar from './calendarService'
import * as email from './emailService'
import * as unifiedEmail from './unifiedEmailService'
import * as news from './newsService'
import * as weather from './weatherService'
import * as task from './taskService'
import { generateBriefing } from './briefingService'

export { calendar, email, unifiedEmail, news, weather, task, generateBriefing }
