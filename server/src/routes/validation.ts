import express from 'express'

// Meme "shape" de resultat que zod `safeParse` (success + error.issues) -
// type structurel plutot qu'un import direct du type zod pour rester
// insensible a la version exacte de la lib.
export interface SafeParseLike {
    success: boolean
    error?: { issues: Array<{ path: PropertyKey[]; message: string }> }
}

/**
 * Fusionne les résultats de plusieurs `safeParse` (params + query) et répond
 * 400 si l'un d'eux échoue - factorise le bloc identique entre les endpoints
 * `/api/boulodromes/:id/*` et `/api/geocode`, qui valident tous params et/ou
 * query séparément.
 *
 * @param {express.Response} res - Réponse HTTP sur laquelle écrire le 400 en cas d'échec.
 * @param {SafeParseLike[]} results - Résultats `safeParse` à fusionner (un par source validée).
 * @returns {boolean} `true` si un 400 a été envoyé (au moins un résultat invalide), `false` sinon.
 */
export function rejectIfInvalid(res: express.Response, results: SafeParseLike[]): boolean {
    const issues = results.flatMap((result) => (result.success ? [] : (result.error?.issues ?? [])))
    if (issues.length === 0) return false

    res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    })
    return true
}
