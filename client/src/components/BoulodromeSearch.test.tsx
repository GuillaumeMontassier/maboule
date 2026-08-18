import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BoulodromeSearch } from './BoulodromeSearch'
import type { BoulodromeHistoryEntry } from '../hooks/use-boulodrome-history'
import { fetchBoulodromes } from '../api/boulodromes'
import type { BoulodromesFeatureCollection } from '../api/boulodromes'

vi.mock('../api/boulodromes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/boulodromes')>()),
    fetchBoulodromes: vi.fn()
}))

function featureFor(id: string, name: string): BoulodromesFeatureCollection['features'][number] {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
        properties: {
            id,
            name,
            street: '1 rue de Paris',
            postalCode: '75001',
            city: 'Paris',
            inseeCode: null,
            siteName: null,
            equipmentType: null,
            groundType: null,
            freeAccess: null,
            source: 'data-es',
            lastSyncedAt: '2026-07-24T10:00:00.000Z'
        }
    }
}

function collectionWithBoulodrome(id: string, name: string): BoulodromesFeatureCollection {
    return { type: 'FeatureCollection', features: [featureFor(id, name)] }
}

interface Deferred<T> {
    promise: Promise<T>
    resolve: (value: T) => void
}

function defer<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((res) => {
        resolve = res
    })
    return { promise, resolve }
}

function wait(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// Porte reellement l'etat de l'historique (contrairement aux autres tests qui
// passent un tableau statique) pour pouvoir observer ce qui se passe dans le
// DOM quand une suppression retire vraiment une entree - notamment le
// deplacement de focus qu'une suppression via clavier/clic provoque quand le
// bouton supprime est retire du DOM.
function ControlledHistorySearch({ initialHistory }: { initialHistory: BoulodromeHistoryEntry[] }) {
    const [history, setHistory] = useState(initialHistory)
    return (
        <BoulodromeSearch
            onSelectBoulodrome={vi.fn()}
            history={history}
            onRemoveFromHistory={(id) => setHistory((current) => current.filter((entry) => entry.id !== id))}
        />
    )
}

afterEach(() => {
    cleanup()
    vi.mocked(fetchBoulodromes).mockReset()
})

describe('BoulodromeSearch', () => {
    it('déclenche une recherche après un court silence de frappe (debounce), pas une requête par caractère', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(collectionWithBoulodrome('data-es:1', 'ARSENAL'))

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.change(input, { target: { value: 'a' } })
        fireEvent.change(input, { target: { value: 'ar' } })
        fireEvent.change(input, { target: { value: 'ars' } })

        await wait(50)
        expect(fetchBoulodromes).not.toHaveBeenCalled()

        expect(await screen.findByText('ARSENAL')).toBeTruthy()
        expect(fetchBoulodromes).toHaveBeenCalledTimes(1)
        expect(fetchBoulodromes).toHaveBeenCalledWith({ search: 'ars' })
    })

    it('ne déclenche aucune requête en dessous de 2 caractères saisis', async () => {
        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.change(input, { target: { value: 'a' } })
        await wait(350)

        expect(fetchBoulodromes).not.toHaveBeenCalled()
    })

    it('ignore une réponse obsolète qui arrive après une recherche plus récente', async () => {
        const firstSearch = defer<BoulodromesFeatureCollection>()
        const secondSearch = defer<BoulodromesFeatureCollection>()
        vi.mocked(fetchBoulodromes).mockReturnValueOnce(firstSearch.promise).mockReturnValueOnce(secondSearch.promise)

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.change(input, { target: { value: 'arsenal' } })
        await wait(350)

        fireEvent.change(input, { target: { value: 'vincennes' } })
        await wait(350)

        expect(fetchBoulodromes).toHaveBeenCalledTimes(2)

        // La deuxieme recherche (plus recente) repond en premier.
        secondSearch.resolve(collectionWithBoulodrome('data-es:2', 'VINCENNES'))
        expect(await screen.findByText('VINCENNES')).toBeTruthy()

        // La premiere recherche (abandonnee) repond ensuite, en retard : elle ne
        // doit pas ecraser le resultat de la recherche plus recente deja affiche.
        firstSearch.resolve(collectionWithBoulodrome('data-es:1', 'ARSENAL'))
        await Promise.resolve()
        await Promise.resolve()

        expect(screen.queryByText('ARSENAL')).toBeNull()
        expect(screen.getByText('VINCENNES')).toBeTruthy()
    })

    it("affiche l'historique au focus du champ vide", () => {
        const history = [
            { id: 'data-es:2', name: 'VINCENNES', siteName: null },
            { id: 'data-es:1', name: 'ARSENAL', siteName: null }
        ]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        expect(screen.queryByText('VINCENNES')).toBeNull()

        fireEvent.focus(input)

        expect(screen.getByText('VINCENNES')).toBeTruthy()
        expect(screen.getByText('ARSENAL')).toBeTruthy()
    })

    it("affiche siteName en evidence au-dessus de name quand l'entree en a un (ticket 23)", () => {
        const history = [{ id: 'data-es:1', name: 'TERRAIN 1', siteName: 'SQUARE DE TEST' }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)

        expect(screen.getByText('SQUARE DE TEST')).toBeTruthy()
        expect(screen.getByText('TERRAIN 1')).toBeTruthy()
    })

    it("n'affiche que name quand siteName est null, sans ligne vide ni doublon (ticket 23)", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)

        const entry = screen.getByRole('button', { name: 'ARSENAL' })
        expect(entry.textContent).toBe('ARSENAL')
    })

    it("n'affiche name qu'une seule fois quand siteName est egal a name (ticket 23)", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: 'ARSENAL' }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)

        const entry = screen.getByRole('button', { name: 'ARSENAL' })
        expect(entry.textContent).toBe('ARSENAL')
    })

    it('distingue par aria-label la croix de suppression de deux entrees qui partagent name mais pas siteName (ticket 23)', () => {
        const history = [
            { id: 'data-es:1', name: 'TERRAIN DE PETANQUE', siteName: 'TEP LOUIS BRAILLE' },
            { id: 'data-es:2', name: 'TERRAIN DE PETANQUE', siteName: 'TEP MENILMONTANT' }
        ]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} onRemoveFromHistory={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)

        expect(
            screen.getByRole('button', { name: "Supprimer TEP LOUIS BRAILLE TERRAIN DE PETANQUE de l'historique" })
        ).toBeTruthy()
        expect(
            screen.getByRole('button', { name: "Supprimer TEP MENILMONTANT TERRAIN DE PETANQUE de l'historique" })
        ).toBeTruthy()
    })

    it("n'affiche pas l'historique une fois qu'une saisie est en cours", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        expect(screen.getByText('ARSENAL')).toBeTruthy()

        fireEvent.change(input, { target: { value: 'a' } })

        expect(screen.queryByText('ARSENAL')).toBeNull()
    })

    it("masque l'historique si le champ vide perd le focus", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        expect(screen.getByText('ARSENAL')).toBeTruthy()

        fireEvent.blur(input)

        expect(screen.queryByText('ARSENAL')).toBeNull()
    })

    it("cliquer une entrée de l'historique sélectionne directement ce boulodrome", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]
        const onSelectBoulodrome = vi.fn()

        render(<BoulodromeSearch onSelectBoulodrome={onSelectBoulodrome} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        fireEvent.click(screen.getByRole('button', { name: 'ARSENAL' }))

        expect(onSelectBoulodrome).toHaveBeenCalledExactlyOnceWith('data-es:1')
    })

    it("affiche une croix de suppression nommant l'entree sur chaque ligne de l'historique", () => {
        const history = [
            { id: 'data-es:1', name: 'ARSENAL', siteName: null },
            { id: 'data-es:2', name: 'VINCENNES', siteName: null }
        ]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} onRemoveFromHistory={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)

        // Aria-label distinct par entree (pas un texte generique identique pour
        // toutes les lignes) : au clavier/lecteur d'ecran, chaque croix doit
        // s'identifier sans dependre de la position visuelle.
        expect(screen.getByRole('button', { name: "Supprimer ARSENAL de l'historique" })).toBeTruthy()
        expect(screen.getByRole('button', { name: "Supprimer VINCENNES de l'historique" })).toBeTruthy()
    })

    it("n'affiche pas de croix de suppression si aucun gestionnaire n'est fourni", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)

        expect(screen.queryByRole('button', { name: "Supprimer ARSENAL de l'historique" })).toBeNull()
    })

    it("cliquer la croix retire l'entree de l'historique sans selectionner le boulodrome", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]
        const onSelectBoulodrome = vi.fn()
        const onRemoveFromHistory = vi.fn()

        render(
            <BoulodromeSearch
                onSelectBoulodrome={onSelectBoulodrome}
                history={history}
                onRemoveFromHistory={onRemoveFromHistory}
            />
        )
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        fireEvent.click(screen.getByRole('button', { name: "Supprimer ARSENAL de l'historique" }))

        expect(onRemoveFromHistory).toHaveBeenCalledExactlyOnceWith('data-es:1')
        expect(onSelectBoulodrome).not.toHaveBeenCalled()
    })

    it("garde le panneau d'historique ouvert (ne perd pas le focus du widget) apres suppression d'une entree qui avait le focus", () => {
        const history = [
            { id: 'data-es:1', name: 'ARSENAL', siteName: null },
            { id: 'data-es:2', name: 'VINCENNES', siteName: null }
        ]

        render(<ControlledHistorySearch initialHistory={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        const deleteButton = screen.getByRole('button', { name: "Supprimer ARSENAL de l'historique" })
        deleteButton.focus()
        fireEvent.click(deleteButton)

        // La ligne supprimee disparait du DOM (et donc du focus) mais le reste du
        // panneau doit rester visible : le focus doit revenir dans le widget
        // (ici, le champ de recherche) plutot que d'en sortir et de faire
        // basculer `isFocused` a false via `handleBlur`.
        expect(document.activeElement).toBe(input)
        expect(screen.getByText('VINCENNES')).toBeTruthy()
    })

    it("cliquer le reste de la ligne d'historique selectionne toujours le boulodrome", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]
        const onSelectBoulodrome = vi.fn()

        render(
            <BoulodromeSearch onSelectBoulodrome={onSelectBoulodrome} history={history} onRemoveFromHistory={vi.fn()} />
        )
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        fireEvent.click(screen.getByRole('button', { name: 'ARSENAL' }))

        expect(onSelectBoulodrome).toHaveBeenCalledExactlyOnceWith('data-es:1')
    })

    it("n'affiche pas la croix d'effacement quand le champ est vide", () => {
        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />)

        expect(screen.queryByRole('button', { name: 'Effacer la recherche' })).toBeNull()
    })

    it("affiche la croix d'effacement dès que le champ contient du texte", () => {
        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.change(input, { target: { value: 'a' } })

        expect(screen.getByRole('button', { name: 'Effacer la recherche' })).toBeTruthy()
    })

    it("n'affiche pas la croix d'effacement pour une saisie uniquement composée d'espaces", () => {
        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.change(input, { target: { value: '  ' } })

        expect(screen.queryByRole('button', { name: 'Effacer la recherche' })).toBeNull()
    })

    it('cliquer la croix vide le champ, referme les résultats et rend le focus au champ', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(collectionWithBoulodrome('data-es:1', 'ARSENAL'))

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.change(input, { target: { value: 'ars' } })
        await screen.findByText('ARSENAL')

        fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }))

        expect((input as HTMLInputElement).value).toBe('')
        expect(screen.queryByText('ARSENAL')).toBeNull()
        expect(document.activeElement).toBe(input)
        expect(screen.queryByRole('button', { name: 'Effacer la recherche' })).toBeNull()
    })

    it("cliquer une entrée de l'historique referme la liste d'historique et rend le focus au champ (ticket 24)", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        fireEvent.click(screen.getByRole('button', { name: 'ARSENAL' }))

        expect(screen.queryByText('ARSENAL')).toBeNull()
        // Le bouton cliqué disparaît du DOM avec la liste : sans recadrage
        // explicite du focus, un vrai clic (qui focus d'abord le bouton avant
        // le déclenchement du click) laisserait le focus retomber sur
        // `document.body` plutôt que de rester dans le widget.
        expect(document.activeElement).toBe(input)
    })

    it('cliquer un résultat de recherche referme la liste de résultats et rend le focus au champ (ticket 24)', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(collectionWithBoulodrome('data-es:1', 'ARSENAL'))
        const onSelectBoulodrome = vi.fn()

        render(<BoulodromeSearch onSelectBoulodrome={onSelectBoulodrome} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.change(input, { target: { value: 'ars' } })
        await screen.findByText('ARSENAL')

        // Le bouton porte aussi l'adresse dans son nom accessible ; on cible le
        // texte du nom du boulodrome plutot que le nom accessible complet.
        fireEvent.click(screen.getByText('ARSENAL'))

        expect(onSelectBoulodrome).toHaveBeenCalledExactlyOnceWith('data-es:1')
        expect(screen.queryByText('ARSENAL')).toBeNull()
        expect(document.activeElement).toBe(input)
    })

    it("un vrai refocus ulterieur (apres une selection) reaffiche normalement l'historique (ticket 24)", () => {
        const history = [{ id: 'data-es:1', name: 'ARSENAL', siteName: null }]

        render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')

        fireEvent.focus(input)
        fireEvent.click(screen.getByRole('button', { name: 'ARSENAL' }))
        expect(screen.queryByText('ARSENAL')).toBeNull()

        // Le focus programmatique repris par `selectAndClose` ne doit supprimer
        // la reouverture qu'une seule fois : un vrai refocus (ex. l'utilisateur
        // re-clique le champ) doit reafficher l'historique normalement, comme
        // au premier focus.
        fireEvent.blur(input)
        fireEvent.focus(input)

        expect(screen.getByText('ARSENAL')).toBeTruthy()
    })

    it('Entrée sélectionne directement le premier résultat affiché', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue({
            type: 'FeatureCollection',
            features: [featureFor('data-es:1', 'ARSENAL'), featureFor('data-es:2', 'VINCENNES')]
        })
        const onSelectBoulodrome = vi.fn()

        render(<BoulodromeSearch onSelectBoulodrome={onSelectBoulodrome} />)
        const input = screen.getByLabelText('Rechercher un boulodrome')
        const form = input.closest('form')!

        fireEvent.change(input, { target: { value: 'ar' } })
        await screen.findByText('ARSENAL')

        fireEvent.submit(form)

        expect(onSelectBoulodrome).toHaveBeenCalledExactlyOnceWith('data-es:1')
    })
})
