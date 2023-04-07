import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { dietRoutes } from './routes/diet'

export const app = fastify()

app.register(cookie)

app.register(dietRoutes, {
  prefix: 'diet',
})
