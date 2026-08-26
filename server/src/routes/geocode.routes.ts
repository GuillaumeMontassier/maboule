import express from 'express'
import {
    AddressNotFoundError,
    fetchGeocodeCandidates,
    OpenRouteServiceUnavailableError
} from '../routing/openRouteServiceClient'
import { geocodeQuerySchema } from '../schemas/geocodeQuery'
import { rejectIfInvalid } from './validation'

export const geocodeRouter = express.Router()

geocodeRouter.get('/api/geocode', async (req, res) => {
    const parsed = geocodeQuerySchema.safeParse(req.query)
    if (rejectIfInvalid(res, [parsed])) return
    if (!parsed.success) return

    const { q } = parsed.data

    try {
        const candidates = await fetchGeocodeCandidates(q)
        res.json(candidates)
    } catch (error) {
        if (error instanceof AddressNotFoundError) {
            res.status(404).json({ error: error.message })
            return
        }
        // Meme convention 502 que /route : erreur cote fournisseur, pas cote nous.
        if (error instanceof OpenRouteServiceUnavailableError) {
            res.status(502).json({ error: error.message })
            return
        }
        console.error(error)
        res.status(500).json({ error: "Erreur lors du géocodage de l'adresse" })
    }
})
