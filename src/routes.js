import {default as Router} from 'koa-router'
import {default as _} from 'lodash'
import {Promise} from 'bluebird'
import {default as postmark} from 'postmark'
import {default as redis} from 'node-redis'
import {default as jade} from 'jade'

// Configure postmark
const postClient = Promise.promisifyAll(new postmark.Client(loadEnv('POSTMARK_API_KEY')))

// Use redis to mainain a mapping between ARNs and notification namespaces
// This means we can have a nicer name, and avoid dealing with conflicts
Promise.promisifyAll(redis.RedisClient.prototype)
const rc = redis.createClient()

export default new Router()
  // Makes a list of subscribers,
  .post('/list/:name', function *(next) {
  })
  // Adds a new jade template that can be sent to a list of subscribesr
  .post('/template/:name', function *(next) {
  })
  // Select a given template and send the message to the given list
  // Takes a json object with locals for the jade template
  .post('/template/:name/:listName/send', function *(next) {
  })

// Send the list of emails the given HTML document
function batchSend (emails, msg) {
  const messages = _.map(emails, email => {
    return postClient.sendEmail({
      "From": "caleb@thorsteinson.io",
      "To": email,
      "Subject": "Test",
      "HtmlBody": msg,
    })
  })
  return Promise.all(messages)
}
