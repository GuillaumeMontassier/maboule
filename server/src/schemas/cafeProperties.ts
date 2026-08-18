import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { cafes } from '../db/schema'
import { PointGeometrySchema } from './boulodromeProperties'

extendZodWithOpenApi(z)

// Meme principe que BoulodromePropertiesSchema : schema du "row" DB genere
// depuis Drizzle, source de verite pour les types de colonnes.
// `coordinates` (customType PostGIS) n'est pas modelisable par drizzle-zod
// -> exposee via la geometrie GeoJSON, pas les properties.
const cafeRowSchema = createSelectSchema(cafes)

export const CafePropertiesSchema = cafeRowSchema
    .omit({ coordinates: true, sourceId: true, lastSyncedAt: true })
    .extend({
        lastSyncedAt: z.iso.datetime().openapi({ example: '2026-08-06T15:18:11.000Z' }),
        // Calculee par ST_Distance (cf. findCafesNearBoulodrome), pas une
        // colonne de la table `cafes` : ajoutee a la main, absente du schema
        // genere par drizzle-zod.
        distanceMeters: z.number().openapi({
            description: 'Distance au boulodrome, en mètres (calcul PostGIS ST_Distance)',
            example: 77
        })
    })
    .openapi('CafeProperties')

export const CafeFeatureSchema = z
    .object({
        type: z.literal('Feature'),
        geometry: PointGeometrySchema,
        properties: CafePropertiesSchema
    })
    .openapi('CafeFeature')

export const CafeFeatureCollectionSchema = z
    .object({
        type: z.literal('FeatureCollection'),
        features: z.array(CafeFeatureSchema)
    })
    .openapi('CafeFeatureCollection')
