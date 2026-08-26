import path from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { logger } from '../logger'
import { db, pool } from './client'

async function main() {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') })
    logger.info('Migrations appliquées')
    await pool.end()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        logger.error('Échec des migrations', { error })
        process.exit(1)
    })
