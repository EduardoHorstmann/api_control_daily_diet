import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id'

export async function dietRoutes(app: FastifyInstance) {
  // ROUTES USER
  app.post('/users', async (request, reply) => {
    const createUser = z.object({
      name: z.string(),
      age: z.number(),
      height: z.number(),
      weight: z.number(),
    })
    const { name, age, height, weight } = createUser.parse(request.body)

    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // day
      })
    }
    await knex('users').insert({
      id: randomUUID(),
      name,
      age,
      height,
      weight,
      session_id: sessionId,
    })
    return reply.status(201).send()
  })

  app.get(
    '/users',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const users = await knex('users').select()
      return { users }
    },
  )

  app.get(
    '/users/:userId',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getUserParams = z.object({
        userId: z.string().uuid(),
      })
      const { userId } = getUserParams.parse(request.params)
      const { sessionId } = request.cookies

      const user = await knex('users')
        .where({
          session_id: sessionId,
          id: userId,
        })
        .first()
      return { user }
    },
  )

  app.get('/users/snacks/:userId', async (request, reply) => {
    const { userId } = request.params
    const stacksUser = await knex('users')
      .select('snack.*')
      .leftJoin('relusersnack', 'relusersnack.userId', 'users.id')
      .leftJoin('snack', 'relusersnack.snackId', 'snack.id')
      .where('userId', userId)
    return { stacksUser }
  })

  app.get('/users/metrics/:userId', async (request, reply) => {
    const { userId, date } = request.params
    const total = await knex('users')
      .count({ 'Total de Refeições': '*' })
      .leftJoin('relusersnack', 'relusersnack.userId', 'users.id')
      .leftJoin('snack', 'relusersnack.snackId', 'snack.id')
      .where('userId', userId)

    const withinDiet = await knex('users')
      .count({ 'Dentro da dieta': '*' })
      .leftJoin('relusersnack', 'relusersnack.userId', 'users.id')
      .leftJoin('snack', 'relusersnack.snackId', 'snack.id')
      .where({ userId, at_diet: 1 })

    const offDiet = await knex('users')
      .count({ 'Fora da dieta': '*' })
      .leftJoin('relusersnack', 'relusersnack.userId', 'users.id')
      .leftJoin('snack', 'relusersnack.snackId', 'snack.id')
      .where({ userId, at_diet: 0 })

    const bestSequence = await knex('users')
      .select({
        best: function () {
          this.count('*')
        },
      })
      .leftJoin('relusersnack', 'relusersnack.userId', 'users.id')
      .leftJoin('snack', 'relusersnack.snackId', 'snack.id')
      .where({ userId, at_diet: 1 })
      .groupBy('date')

    const metrics = { total, withinDiet, offDiet, bestSequence }
    return { metrics }
  })

  // ROUTES SNACK
  app.post('/snack', async (request, reply) => {
    const createSnack = z.object({
      title: z.string(),
      description: z.string(),
      at_diet: z.boolean(),
      date: z.string(),
      time: z.string(),
      userId: z.string().uuid(),
    })
    const { title, description, at_diet, date, time, userId } =
      createSnack.parse(request.body)
    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // day
      })
    }
    const snackId = randomUUID()
    await knex('snack').insert({
      id: snackId,
      title,
      description,
      at_diet,
      date,
      time,
      session_id: sessionId,
    })
    await knex('relusersnack').insert({
      idRel: randomUUID(),
      userId,
      snackId,
    })
    return reply.status(201).send()
  })

  app.get(
    '/snack',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const snacks = await knex('snack').where('session_id', sessionId).select()
      return { snacks }
    },
  )

  app.put(
    '/snack/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const updateSnack = z.object({
        title: z.string(),
        description: z.string(),
        at_diet: z.boolean(),
        date: z.string(),
        time: z.string(),
      })

      const data = updateSnack.parse(request.body)
      const { id } = request.params

      await knex('snack')
        .update({
          title: data.title,
          description: data.description,
          at_diet: data.at_diet,
          date: data.date,
          time: data.time,
        })
        .where({ id, session_id: sessionId })
    },
  )

  app.delete(
    '/snack/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { id } = request.params
      const { sessionId } = request.cookies
      await knex('snack').delete().where({ id, session_id: sessionId })
    },
  )
  app.get(
    '/snack/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { id } = request.params
      const { sessionId } = request.cookies
      const snack = await knex('snack')
        .select()
        .where({ id, session_id: sessionId })
      return { snack }
    },
  )

  // ROUTES RELATIONSHIP
  app.get('/relship', async (request, reply) => {
    const relship = await knex('relusersnack').select()
    return { relship }
  })
}
