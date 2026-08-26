import express from 'express'
import { db } from '../db/client'
import { findAllBoulodromes, findBoulodromeById } from '../db/boulodromesRepository'
import { findCafesNearBoulodrome } from '../db/cafesRepository'
import { toBoulodromeFeatureCollection } from '../geojson/boulodromes'
import { toCafeFeatureCollection } from '../geojson/cafes'
import { GeoCoordinates } from '../models/geo'
import { fetchWalkingRoute } from '../routing/openRouteServiceClient'
import { boulodromeIdParamSchema, cafesNearBoulodromeQuerySchema } from '../schemas/cafesNearBoulodromeQuery'
import { boulodromesQuerySchema } from '../schemas/boulodromesQuery'
import { routeQuerySchema } from '../schemas/routeQuery'
import { rejectIfInvalid } from './validation'

export const boulodromesRouter = express.Router()

boulodromesRouter.get('/api/boulodromes', async (req, res) => {
    const parsed = boulodromesQuerySchema.safeParse(req.query)
    if (!parsed.success) {
        res.status(400).json({
            error: 'Paramètres de requête invalides',
            details: parsed.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        })
        return
    }

    const { q, groundType, equipmentType, freeAccess, bbox } = parsed.data

    const rows = await findAllBoulodromes(db, {
        ...(q ? { search: q } : {}),
        ...(groundType ? { groundTypes: groundType } : {}),
        ...(equipmentType ? { equipmentTypes: equipmentType } : {}),
        ...(freeAccess !== undefined ? { freeAccess } : {}),
        ...(bbox ? { boundingBox: bbox } : {})
    })
    res.json(toBoulodromeFeatureCollection(rows))
})

boulodromesRouter.get('/api/boulodromes/:id/cafes', async (req, res) => {
    const parsedParams = boulodromeIdParamSchema.safeParse(req.params)
    const parsedQuery = cafesNearBoulodromeQuerySchema.safeParse(req.query)
    if (rejectIfInvalid(res, [parsedParams, parsedQuery])) return
    if (!parsedParams.success || !parsedQuery.success) return

    const { id } = parsedParams.data
    const { radius } = parsedQuery.data

    // Necessaire pour distinguer "boulodrome inconnu" (404) de "boulodrome
    // existant mais sans café dans le rayon" (200 + FeatureCollection vide) —
    // findCafesNearBoulodrome seul ne fait pas la difference (jointure sans
    // resultat dans les deux cas).
    const boulodrome = await findBoulodromeById(db, id)
    if (!boulodrome) {
        res.status(404).json({ error: 'Boulodrome introuvable' })
        return
    }

    const rows = await findCafesNearBoulodrome(db, id, radius)
    res.json(toCafeFeatureCollection(rows))
})

boulodromesRouter.get('/api/boulodromes/:id/route', async (req, res) => {
    const parsedParams = boulodromeIdParamSchema.safeParse(req.params)
    const parsedQuery = routeQuerySchema.safeParse(req.query)
    if (rejectIfInvalid(res, [parsedParams, parsedQuery])) return
    if (!parsedParams.success || !parsedQuery.success) return

    const { id } = parsedParams.data
    const { from } = parsedQuery.data

    const boulodrome = await findBoulodromeById(db, id)
    if (!boulodrome) {
        res.status(404).json({ error: 'Boulodrome introuvable' })
        return
    }

    const destination = new GeoCoordinates(boulodrome.latitude, boulodrome.longitude)
    const route = await fetchWalkingRoute(from, destination)
    res.json(route)
})
