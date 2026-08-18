import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import type { BoundingBox } from '../db/boulodromesRepository'

extendZodWithOpenApi(z)

function toStringArray(value: string | string[]): string[] {
    const raw = Array.isArray(value) ? value : [value]
    return raw
        .flatMap((v) => v.split(','))
        .map((v) => v.trim())
        .filter(Boolean)
}

// Liste de valeurs (ex. `?groundType=Sable&groundType=Stabilisé/cendrée` ou
// `?groundType=Sable,Stabilisé/cendrée`) : une liste vide une fois nettoyee
// (que des virgules/espaces) est traitee comme "pas de filtre", pas comme
// une erreur - comportement attendu d'un filtre multi-select vide cote UI.
const listParam = z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
        if (value === undefined) return undefined
        const values = toStringArray(value)
        return values.length > 0 ? values : undefined
    })

// "true"/"false" strict : toute autre valeur (ex. "yes", parametre repete)
// est une erreur de validation plutot qu'un filtre ignore - contrairement a
// `q`/`groundType`/`equipmentType`, un booleen n'a pas d'etat "partiel"
// ambigu qui justifierait d'etre tolerant.
const freeAccessParam = z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true'))

// `?bbox=west,south,east,north` (WGS84, meme ordre que le bbox GeoJSON).
// Comme freeAccess, un rectangle mal forme est une erreur de validation :
// contrairement a un champ de recherche vide, il n'y a pas d'usage legitime
// d'un bbox partiel ou incoherent.
const bboxParam = z
    .string()
    .optional()
    .transform((value, ctx): BoundingBox | undefined => {
        if (value === undefined) return undefined
        const parts = value.split(',').map(Number)
        if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
            ctx.addIssue({
                code: 'custom',
                message: 'bbox doit être au format west,south,east,north (4 nombres séparés par des virgules)'
            })
            return z.NEVER
        }
        const [west, south, east, north] = parts
        if (west >= east || south >= north) {
            ctx.addIssue({
                code: 'custom',
                message: 'bbox invalide : west doit être < east et south doit être < north'
            })
            return z.NEVER
        }
        return { west, south, east, north }
    })

export const boulodromesQuerySchema = z.object({
    q: z
        .string()
        .optional()
        .transform((value) => {
            const trimmed = value?.trim() ?? ''
            return trimmed ? trimmed : undefined
        })
        .openapi({
            description: "Recherche libre sur le nom (équipement/site) ou l'adresse (rue/ville)",
            example: 'arsenal'
        }),
    groundType: listParam.openapi({
        description: 'Filtre exact sur la nature du sol (une ou plusieurs valeurs)',
        example: 'Sable'
    }),
    equipmentType: listParam.openapi({
        description: "Filtre exact sur le type d'équipement (une ou plusieurs valeurs)",
        example: 'Découvert'
    }),
    freeAccess: freeAccessParam.openapi({
        description: "Filtre sur l'accès libre (true) ou payant/restreint (false)"
    }),
    bbox: bboxParam.openapi({
        description: 'Rectangle englobant west,south,east,north (WGS84)',
        example: '2.2,48.8,2.5,48.9'
    })
})

export type BoulodromesQuery = z.infer<typeof boulodromesQuerySchema>
