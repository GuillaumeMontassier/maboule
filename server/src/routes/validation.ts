import express from 'express'

// Meme "shape" de resultat que zod `safeParse` (success + error.issues) -
// type structurel plutot qu'un import direct du type zod pour rester
// insensible a la version exacte de la lib.
export interface SafeParseLike {
    success: boolean
    error?: { issues: Array<{ path: PropertyKey[]; message: string }> }
}

// Fusionne les resultats de plusieurs `safeParse` (params + query) et repond
// 400 si l'un d'eux echoue - factorise le bloc identique entre les endpoints
// `/api/boulodromes/:id/*` et `/api/geocode`, qui valident tous params et/ou
// query separement.
export function rejectIfInvalid(res: express.Response, results: SafeParseLike[]): boolean {
    const issues = results.flatMap((result) => (result.success ? [] : (result.error?.issues ?? [])))
    if (issues.length === 0) return false

    res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    })
    return true
}
