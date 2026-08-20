import { db, pool } from '../db/client'
import { upsertCafes } from '../db/cafesRepository'
import { fetchParisCafes } from './osmCafes'

async function main() {
    const cafes = await fetchParisCafes()
    console.log(`${cafes.length} cafés/bars récupérés depuis OpenStreetMap`)

    await upsertCafes(db, cafes)
    console.log('Import terminé')

    await pool.end()
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
