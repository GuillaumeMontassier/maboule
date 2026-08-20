import { describe, expect, it } from 'vitest'
import { distinctSiteName } from './site-name'

describe('distinctSiteName', () => {
    it('retourne siteName quand il differe de name', () => {
        expect(distinctSiteName('TERRAIN DE PETANQUE', 'TEP LOUIS BRAILLE')).toBe('TEP LOUIS BRAILLE')
    })

    it('retourne null quand siteName est egal a name', () => {
        expect(distinctSiteName('ARSENAL', 'ARSENAL')).toBeNull()
    })

    it('retourne null quand siteName est null', () => {
        expect(distinctSiteName('ARSENAL', null)).toBeNull()
    })

    it('retourne null quand siteName est blanc', () => {
        expect(distinctSiteName('ARSENAL', '   ')).toBeNull()
    })

    it('retourne siteName sans espaces de bord', () => {
        expect(distinctSiteName('ARSENAL', '  SQUARE DE TEST  ')).toBe('SQUARE DE TEST')
    })
})
