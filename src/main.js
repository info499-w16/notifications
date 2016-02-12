import {Promise} from 'bluebird'
import {default as AWS} from 'aws-sdk'

// Load environment variables
function loadEnv (envName) {
  const env = process.env[envName]
  if (!env) throw new Error('Failed to load ENV variable: ' + envName)
}

// The SDK loads env variables automatically, so we just need to make sure
// they are actually loaded
loadEnv('AWS_ACCESS_KEY_ID')
loadEnv('AWS_SECRET_ACCESS_KEY')

// Sets region to Virginia. This is because this is the only
// region which supports SMS (as of 2/11/2016)
AWS.config.update({region: 'us-east-1'})

// Test out using SNS
const sns = new AWS.SNS()
const params = {
  Message: 'Test Message',
  Subject: 'Test Email',
  TopicArn: 'arn:aws:sns:us-east-1:867131015577:test'
}

Promise.promisifyAll(sns)
sns.publishAsync(params)
  .then(data => {
    console.log(data) // successful response
  })
  .catch(e => {
    console.log(e)
  })
