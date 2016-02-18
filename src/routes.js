import {default as Router} from 'koa-router'
import {default as _} from 'lodash'
import {Promise} from 'bluebird'
import {default as postmark} from 'postmark'
import {default as redis} from 'node-redis'
import {default as jade} from 'jade'

import {loadEnv} from './utils'

// Configure postmark
const postClient = Promise.promisifyAll(new postmark.Client(loadEnv('POSTMARK_API_KEY')))

// Use redis to mainain a mapping between ARNs and notification namespaces
// This means we can have a nicer name, and avoid dealing with conflicts
Promise.promisifyAll(redis.RedisClient.prototype)
const rc = redis.createClient()

export default new Router()
  // Makes a list of subscribers,
  .post('/list/:name', function *(next) {
    _.map(this.request.body.emails, email => {
      rc.sadd(`list:${this.params.name}`, email)
    })
    this.body = 'Created new list'
  })
  // Gets all of the subscribers in a list
  .get('/list/:name', function *(next) {
    const members = yield rc.smembersAsync(`list:${this.params.name}`)
    // Gets a BUFFER, not a string
    this.body = _.map(members, member => member.toString())
  })
  // Adds a new jade template that can be sent to a list of subscribers
  .post('/template/:name', function *(next) {
    rc.set(`template:${this.params.name}`, this.params.name)
    this.body = 'Added new template'
  })
  // Select a given template and send the message to the given list
  // Takes a json object with locals for the jade template
  .post('/template/:name/:listName/send', function *(next) {
    // Load up the template
    const template = yield rc.getAsync(`template:${this.params.name}`)
    // Load up the emails to send
    const emails = yield rc.smembersAsync(`list:${this.params.name}`)

    const locals = this.request.body.locals

    // Compile the message to send
    const generator = jade.compile(template)
    const message = generator(locals)
    yield batchSend(emails, message)
    this.body = 'Successfully emailed everyone in the list'
  })

// Send the list of emails the given HTML document
function batchSend (emails, msg) {
  const messages = _.map(emails, email => {
    return postClient.sendEmail({
      'From': 'caleb@thorsteinson.io',
      'To': email,
      'Subject': 'Test',
      'HtmlBody': msg
    })
  })
  return Promise.all(messages)
}
