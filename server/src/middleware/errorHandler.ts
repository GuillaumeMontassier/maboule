import express from 'express'
import {
    AddressNotFoundError,
    OpenRouteServiceUnavailableError,
    RouteNotFoundError
} from '../routing/openRouteServiceClient'

/**
 * Middleware d'erreur Express centralisé (signature à 4 arguments, monté en
 * dernier) : traduit les erreurs connues en réponse HTTP, à la place des
 * `try/catch` auparavant dupliqués dans chaque handler de route. Express 5
 * transmet automatiquement les rejets de promesse des handlers `async` ici,
 * pas besoin d'appeler `next(error)` explicitement dans les routes.
 *
 * @param {unknown} error - L'erreur interceptée par Express.
 * @param {express.Request} _req - Requête HTTP (non utilisée).
 * @param {express.Response} res - Réponse HTTP à construire.
 * @param {express.NextFunction} _next - Callback suivant, requis par Express pour reconnaître ce middleware comme gestionnaire d'erreur (non utilisé).
 * @returns {void}
 */
export function errorHandler(
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
): void {
    if (error instanceof RouteNotFoundError || error instanceof AddressNotFoundError) {
        res.status(404).json({ error: error.message })
        return
    }

    // 502 (Bad Gateway) plutot que 500 : l'erreur vient du fournisseur
    // externe, pas d'un bug de notre cote - meme convention pour panne,
    // timeout et quota depasse (cf. spec, pas de distinction utile pour
    // l'appelant entre ces trois cas).
    if (error instanceof OpenRouteServiceUnavailableError) {
        res.status(502).json({ error: error.message })
        return
    }

    console.error(error)
    res.status(500).json({ error: 'Erreur inattendue côté serveur' })
}
