import { describe, expect, it } from 'vitest'
import { geocodeQuerySchema } from './geocodeQuery'

function parse(query: Record<string, unknown>) {
    return geocodeQuerySchema.safeParse(query)
}

describe('geocodeQuerySchema - q', () => {
    it('accepte une adresse non vide', () => {
        const result = parse({ q: '12 rue de Rivoli, Paris' })
        expect(result.success && result.data.q).toBe('12 rue de Rivoli, Paris')
    })

    it('rejette une valeur absente', () => {
        expect(parse({}).success).toBe(false)
    })

    it("rejette une chaîne vide ou composée uniquement d'espaces", () => {
        expect(parse({ q: '' }).success).toBe(false)
        expect(parse({ q: '   ' }).success).toBe(false)
    })

    it('retire les espaces superflus', () => {
        const result = parse({ q: '  Tour Eiffel  ' })
        expect(result.success && result.data.q).toBe('Tour Eiffel')
    })
})
