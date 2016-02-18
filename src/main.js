import {default as koa} from 'koa'
import {default as bodyParser} from 'koa-bodyparser'
import {default as logger} from 'koa-logger'

import {default as heartbeat} from './heartbeat'
import {default as route} from './routes'

// Constants
const NAME = 'notifications'
const VERSION = '0.0.1'
const PORT = process.env.PORT || 80

koa()
	.use(logger())
  .use(bodyParser())
  .use(route.routes())
  .listen(PORT)

console.log(`Notification service running on port ${PORT}`)

// Send beat data
heartbeat(NAME, VERSION)
