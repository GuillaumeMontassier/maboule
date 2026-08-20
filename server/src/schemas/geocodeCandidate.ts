import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

// Coordonnees exposees comme {latitude, longitude} (meme forme que
// GeoCoordinates), pas comme geometrie GeoJSON Point : contrairement aux
// boulodromes/cafes, la reponse de /api/geocode n'est pas une
// FeatureCollection, juste une liste de candidats (cf. spec).
export const GeocodeCandidateSchema = z
    .object({
        label: z.string().openapi({
            description: "Libellé lisible de l'adresse candidate",
            example: '12 Rue de Rivoli, 75001 Paris, France'
        }),
        coordinates: z
            .object({
                latitude: z.number(),
                longitude: z.number()
            })
            .openapi({
                example: { latitude: 48.8566, longitude: 2.3522 }
            })
    })
    .openapi('GeocodeCandidate')

export const GeocodeCandidateListSchema = z.array(GeocodeCandidateSchema).openapi('GeocodeCandidateList')
