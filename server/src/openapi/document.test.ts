import { describe, expect, it } from 'vitest'
import { generateOpenApiDocument } from './document'

describe('generateOpenApiDocument', () => {
    it("génère un document sans lever d'erreur, avec les routes attendues", () => {
        const document = generateOpenApiDocument()

        expect(document.openapi).toBe('3.1.0')
        expect(document.paths?.['/api/boulodromes']?.get).toBeDefined()
        expect(document.paths?.['/api/geocode']?.get).toBeDefined()
        expect(document.paths?.['/health']?.get).toBeDefined()
    })

    it('référence le schéma BoulodromeFeatureCollection en réponse 200', () => {
        const document = generateOpenApiDocument()
        const responses = document.paths?.['/api/boulodromes']?.get?.responses

        expect(responses?.['200']).toBeDefined()
        expect(document.components?.schemas?.['BoulodromeFeatureCollection']).toBeDefined()
    })
})
