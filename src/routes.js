import {default as Router} from 'koa-router'
import {default as _} from 'lodash'
import {Promise} from 'bluebird'
import {default as AWS} from 'aws-sdk'
import {default as redis} from 'node-redis'

// Use redis to mainain a mapping between ARNs and notification namespaces
// This means we can have a nicer name, and avoid dealing with conflicts
Promise.promisifyAll(redis.RedisClient.prototype)
const rc = redis.createClient()

// Sets region to Virginia. This is because this is the only
// region which supports SMS (as of 2/11/2016)
AWS.config.update({region: 'us-east-1'})

// Make a promise friendly version of the API
const sns = new AWS.SNS({region: 'us-east-1'})
Promise.promisifyAll(sns)

export default new Router()
  .post('/topic', function *(next) {
    // Create a new topic for subscriptions,
    // Takes a list of default subscribers (in the form of ids)

    try {
      // Subscribers is an array that with objects that look like this
      // {email: <email>, phone: <phone>}
      //
      // We subscribe the users based on what information is provided. If
      // users don't want to subscribe via sms or at all, don't send anything
      const users = this.request.body.subscribers
      const emails = _.chain(users)
        .filter(user => user.email)
        .map(user => user.email)
        .value()
      const numbers = _.chain(users)
        .filter(user => user.number)
        .map(user => user.number)
        .value()

      const params = {
        Name: this.request.body.topicName
        // DisplayName: this.request.body.displayName // needed for sms
      }
      // Make a new topic (idempotent)
      const {TopicArn} = yield sns.createTopicAsync(params)
      // now store the Arn for easy lookup in the future
      rc.set(this.request.body.topicName, TopicArn)

      // With the topic created, we want to now add the subscribers that were
      // included by default
      yield [ // Yield as an array to perform in parallel
        batchSub(emails, TopicArn)('email'),
        batchSub(numbers, TopicArn)('sms')
      ]

      this.status = 200
      this.body = 'Successfully created a new subscription topic'
    } catch (e) {
      console.log(e)
      this.throw(400, e)
    }
  })
  // Publishes a new message on a given channel
  .post('/topic/:name/publish', function *(next) {
    try {
      // Lookup the arn for the topic we created
      const arn = yield rc.getAsync(this.params.name)
      const params = {
        Message: this.request.body.message,
        Subject: this.request.body.subject,
        TopicArn: arn
      }

      // Publish a message
      yield sns.publishAsync(params)

      this.status = 200
      this.body = 'Successfully published message'
    } catch (e) {
      this.throw(400, e)
    }
  })

// Returns a function which generates a promise batching the
// requests for a given protocol
function batchSub (endpoints, arn) {
  return function (protocol) {
    const subscriptions = _.map(endpoints, endpoint => {
      const params = {
        Protocol: protocol, /* required */
        TopicArn: arn,
        Endpoint: endpoint
      }
      return sns.subscribeAsync(params)
    })
    return Promise.all(subscriptions)
  }
}
