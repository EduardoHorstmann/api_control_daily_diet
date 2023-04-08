import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('relusersnack', (table) => {
    table.uuid('idRel')
    table.uuid('userId')
    table.uuid('snackId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('relusersnack')
}
