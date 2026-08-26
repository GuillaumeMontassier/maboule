import { db, pool } from '../db/client'
import { upsertBoulodromes } from '../db/boulodromesRepository'
import { logger } from '../logger'
import { fetchParisBoulodromes } from './dataEs'

async function main() {
    const boulodromes = await fetchParisBoulodromes()
    logger.info('Boulodromes récupérés depuis Data ES', { count: boulodromes.length })

    await upsertBoulodromes(db, boulodromes)
    logger.info('Import terminé')

    await pool.end()
}

main().catch((error) => {
    logger.error("Échec de l'import des boulodromes", { error })
    process.exitCode = 1
})
