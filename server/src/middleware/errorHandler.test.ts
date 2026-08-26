import express from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AddressNotFoundError, OpenRouteServiceUnavailableError, RouteNotFoundError } from '../routing/openRouteServiceClient'
import { errorHandler } from './errorHandler'

interface MockResponse {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
}

function buildMockResponse(): MockResponse {
    const res: MockResponse = {
        status: vi.fn(),
        json: vi.fn()
    }
    res.status.mockReturnValue(res)
    return res
}

const NOOP_NEXT: express.NextFunction = () => {}

describe('errorHandler', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks()
    })

    it('traduit RouteNotFoundError en 404 avec le message de l\'erreur', (): void => {
        const res = buildMockResponse()
        const error = new RouteNotFoundError('Aucun itinéraire trouvé')

        errorHandler(error, {} as express.Request, res as unknown as express.Response, NOOP_NEXT)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ error: 'Aucun itinéraire trouvé' })
    })

    it('traduit AddressNotFoundError en 404 avec le message de l\'erreur', (): void => {
        const res = buildMockResponse()
        const error = new AddressNotFoundError('Aucune adresse trouvée')

        errorHandler(error, {} as express.Request, res as unknown as express.Response, NOOP_NEXT)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ error: 'Aucune adresse trouvée' })
    })

    it('traduit OpenRouteServiceUnavailableError en 502 avec le message de l\'erreur', (): void => {
        const res = buildMockResponse()
        const error = new OpenRouteServiceUnavailableError('indisponible')

        errorHandler(error, {} as express.Request, res as unknown as express.Response, NOOP_NEXT)

        expect(res.status).toHaveBeenCalledWith(502)
        expect(res.json).toHaveBeenCalledWith({ error: 'indisponible' })
    })

    it('retombe sur 500 avec un message générique pour une erreur inconnue', (): void => {
        vi.spyOn(console, 'error').mockImplementation((): void => {})
        const res = buildMockResponse()
        const error = new Error('boom, détail interne')

        errorHandler(error, {} as express.Request, res as unknown as express.Response, NOOP_NEXT)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Erreur inattendue côté serveur' })
    })

    it("journalise le détail de l'erreur inconnue côté serveur sans l'exposer au client", (): void => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})
        const res = buildMockResponse()
        const error = new Error('boom, détail interne')

        errorHandler(error, {} as express.Request, res as unknown as express.Response, NOOP_NEXT)

        expect(consoleErrorSpy).toHaveBeenCalledWith(error)
        expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('détail interne') }))
    })
})
