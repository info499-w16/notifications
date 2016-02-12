import {default as koa} from 'koa'
import {default as bodyParser} from 'koa-bodyparser'

import {default as heartbeat} from './heartbeat'
import {default as route} from './routes'

// Constants
const NAME = 'notifications'
const VERSION = '0.0.1'
const PORT = process.env.PORT || 80

// Load required environment variables
function loadEnv (envName) {
  const env = process.env[envName]
  if (!env) throw new Error('Failed to load ENV variable: ' + envName)
}

// The SDK loads env variables automatically, so we just need to make sure
// they are actually loaded
loadEnv('AWS_ACCESS_KEY_ID')
loadEnv('AWS_SECRET_ACCESS_KEY')

koa()
  .use(bodyParser())
  .use(route.routes())
  .listen(PORT)

console.log(`Notification service running on port ${PORT}`)

// Send beat data
heartbeat(NAME, VERSION)
