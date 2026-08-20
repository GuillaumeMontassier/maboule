import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

// Contrairement a `q` sur /api/boulodromes (filtre optionnel, absence = "pas
// de filtre"), `q` est ici obligatoire : il n'y a pas de geocodage "par
// defaut" sans adresse a chercher.
export const geocodeQuerySchema = z.object({
    q: z.string().trim().min(1, 'q est requis et ne peut pas être vide').openapi({
        description: 'Adresse à géocoder',
        example: '12 rue de Rivoli, Paris'
    })
})

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>
