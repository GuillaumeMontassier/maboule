import express from 'express'
import { fetchGeocodeCandidates } from '../routing/openRouteServiceClient'
import { geocodeQuerySchema } from '../schemas/geocodeQuery'
import { rejectIfInvalid } from './validation'

export const geocodeRouter = express.Router()

geocodeRouter.get('/api/geocode', async (req, res) => {
    const parsed = geocodeQuerySchema.safeParse(req.query)
    if (rejectIfInvalid(res, [parsed])) return
    if (!parsed.success) return

    const { q } = parsed.data

    const candidates = await fetchGeocodeCandidates(q)
    res.json(candidates)
})
