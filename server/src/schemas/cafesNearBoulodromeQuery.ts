import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const boulodromeIdParamSchema = z.object({
    id: z.string().min(1).openapi({
        description: 'Identifiant du boulodrome',
        example: 'data-es:E004I751120045'
    })
})

export type BoulodromeIdParam = z.infer<typeof boulodromeIdParamSchema>

export const cafesNearBoulodromeQuerySchema = z.object({
    radius: z
        .string()
        .optional()
        .transform((value, ctx) => {
            // Pas de rayon fourni : 200m par defaut (portee d'une courte marche a
            // pied, cf. discussion produit).
            if (value === undefined) return 200
            const radius = Number(value)
            if (!Number.isFinite(radius) || radius <= 0) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'radius doit être un nombre positif (en mètres)'
                })
                return z.NEVER
            }
            return radius
        })
        .openapi({
            description: 'Rayon de recherche autour du boulodrome, en mètres (défaut 200)',
            example: '200'
        })
})

export type CafesNearBoulodromeQuery = z.infer<typeof cafesNearBoulodromeQuerySchema>
