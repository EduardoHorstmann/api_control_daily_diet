import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary()
    table.text('name').notNullable()
    table.smallint('age').notNullable()
    table.smallint('height').notNullable()
    table.smallint('weight').notNullable()
    table.uuid('session_id').after('id').index()
    table.foreign('id').references('userId').inTable('relusersnack')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}
