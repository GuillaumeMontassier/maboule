import { db, pool } from '../db/client'
import { upsertCafes } from '../db/cafesRepository'
import { logger } from '../logger'
import { fetchParisCafes } from './osmCafes'

async function main() {
    const cafes = await fetchParisCafes()
    logger.info('Cafés/bars récupérés depuis OpenStreetMap', { count: cafes.length })

    await upsertCafes(db, cafes)
    logger.info('Import terminé')

    await pool.end()
}

main().catch((error) => {
    logger.error("Échec de l'import des cafés", { error })
    process.exitCode = 1
})
