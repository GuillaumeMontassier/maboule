export interface GeocodeCandidate {
    label: string
    coordinates: { latitude: number; longitude: number }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchGeocodeCandidates(query: string): Promise<GeocodeCandidate[]> {
    const params = new URLSearchParams({ q: query })

    const response = await fetch(`${API_URL}/api/geocode?${params.toString()}`)
    if (response.status === 404) {
        throw new Error('Aucune adresse ne correspond à cette recherche.')
    }
    if (response.status === 502 || response.status === 503) {
        throw new Error('Le service de géocodage est momentanément indisponible. Réessayez plus tard.')
    }
    if (!response.ok) {
        throw new Error(`Erreur lors de la recherche d'adresse (${response.status})`)
    }
    return response.json()
}
