import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from './logger'

describe('logger.info', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks()
    })

    it('écrit une ligne JSON sur console.log avec le niveau, le message et un timestamp ISO', (): void => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((): void => {})

        logger.info('Serveur démarré')

        expect(consoleLogSpy).toHaveBeenCalledTimes(1)
        const entry = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
        expect(entry).toMatchObject({ level: 'info', message: 'Serveur démarré' })
        expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp)
    })

    it('inclut les champs additionnels fournis dans la ligne structurée', (): void => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((): void => {})

        logger.info('Import terminé', { count: 42 })

        const entry = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
        expect(entry.count).toBe(42)
    })

    it('ne laisse pas un champ additionnel nommé message/level/timestamp écraser les métadonnées réservées', (): void => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((): void => {})

        logger.info('Import terminé', { message: 'usurpé', level: 'usurpé', timestamp: 'usurpé' })

        const entry = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
        expect(entry.message).toBe('Import terminé')
        expect(entry.level).toBe('info')
        expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp)
    })
})

describe('logger.error', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks()
    })

    it('écrit une ligne JSON sur console.error avec le niveau et le message', (): void => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})

        logger.error('Échec des migrations')

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
        const entry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)
        expect(entry).toMatchObject({ level: 'error', message: 'Échec des migrations' })
    })

    it('normalise un champ Error en name/message/stack plutôt que de le sérialiser en objet vide', (): void => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})
        const error = new Error('boom')

        logger.error('uncaughtException', { error })

        const entry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)
        expect(entry.error).toMatchObject({ name: 'Error', message: 'boom' })
        expect(entry.error.stack).toEqual(expect.any(String))
    })

    it('conserve tel quel un champ qui n\'est pas une instance Error', (): void => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})

        logger.error('Échec de l\'import', { boulodromeId: 'abc-123' })

        const entry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)
        expect(entry.boulodromeId).toBe('abc-123')
    })

    it('ne lève pas quand un champ additionnel contient une référence circulaire, et journalise quand même', (): void => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})
        const circular: { self?: unknown } = {}
        circular.self = circular

        expect(() => logger.error('uncaughtException', { context: circular })).not.toThrow()

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
        const entry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)
        expect(entry).toMatchObject({ level: 'error', message: 'uncaughtException' })
    })
})
