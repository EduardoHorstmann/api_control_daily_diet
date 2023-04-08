import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('snack', (table) => {
    table.uuid('id').primary()
    table.text('title').notNullable()
    table.text('description').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.date('date').notNullable()
    table.time('time').notNullable()
    table.boolean('at_diet').notNullable()
    table.uuid('session_id').after('id').index()
    table.foreign('id').references('snackId').inTable('relusersnack')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('snack')
}
