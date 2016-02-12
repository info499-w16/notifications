import {default as Router} from 'koa-router'
import {default as rp} from 'request-promise'
import {default as _} from 'lodash'
import {Promise} from 'bluebird'
import {default as AWS} from 'aws-sdk'
import {default as redis} from 'node-redis'

import {getPylon} from './heartbeat'

// Use redis to mainain a mapping between ARNs and notification namespaces
// This means we can have a nicer name, and avoid dealing with conflicts
Promise.promisifyAll(redis.RedisClient.prototype)
const rc = redis.createClient()

// Make a promise friendly version of the API
const sns = new AWS.SNS()
Promise.promisifyAll(sns)

// Sets region to Virginia. This is because this is the only
// region which supports SMS (as of 2/11/2016)
AWS.config.update({region: 'us-east-1'})

export default new Router()
  .post('/topic', function *(next) {
    // Create a new topic for subscriptions,
    // Takes a list of default subscribers (in the form of ids)

    try {
      const options = {
        method: 'POST',
        uri: getPylon() + '/users',
        body: this.body.ids,
        json: true // Automatically stringifies the body to JSON
      }
      const users = yield rp.post(options)
      // With the populated users, we should be able to subscribe them
      const emails = _.map(users, user => user.email)

      const params = {
        Name: this.body.topicName,
        DisplayName: this.body.displayName // needed for sms
      }
      // Make a new topic (idempotent)
      const {TopicArn} = yield sns.createTopicAsync(params)
      // now store the Arn for easy lookup in the future
      rc.set(this.body.topicName, TopicArn)

      // With the topic created, we want to now add the subscribers that were
      // included by default
      yield batchSubscribe(emails, TopicArn)

      this.status = 200
      this.body = 'Successfully created a new subscription topic'
    } catch (e) {
      this.throw(400, e)
    }
  })
  // Publishes a new message on a given channel
  .post('/topic/:name/publish', function *(next) {
    try {
      // Lookup the arn for the topic we created
      const arn = yield rc.getAsync(this.params.name)
      const params = {
        Message: this.body.message,
        Subject: this.body.subject,
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

// Subscribes many different emails at once
// Returns a promise when all have finished
function batchSubscribe (emails, arn) {
  const subscriptions = _.map(emails, email => {
    const params = {
      Protocol: 'email', /* required */
      TopicArn: arn,
      Endpoint: email
    }
    return sns.subscribeAsync(params)
  })
  return Promise.map(subscriptions)
}
