import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { BoulodromeFeatureCollectionSchema } from '../schemas/boulodromeProperties'
import { boulodromesQuerySchema } from '../schemas/boulodromesQuery'
import { CafeFeatureCollectionSchema } from '../schemas/cafeProperties'
import { boulodromeIdParamSchema, cafesNearBoulodromeQuerySchema } from '../schemas/cafesNearBoulodromeQuery'
import { GeocodeCandidateListSchema } from '../schemas/geocodeCandidate'
import { geocodeQuerySchema } from '../schemas/geocodeQuery'
import { RouteFeatureSchema } from '../schemas/routeProperties'
import { routeQuerySchema } from '../schemas/routeQuery'

const registry = new OpenAPIRegistry()

const errorSchema = z
    .object({
        error: z.string()
    })
    .openapi('Error')

const validationErrorSchema = z
    .object({
        error: z.string(),
        details: z.array(z.object({ path: z.string(), message: z.string() }))
    })
    .openapi('ValidationError')

registry.registerPath({
    method: 'get',
    path: '/api/boulodromes',
    summary: 'Liste des boulodromes parisiens, au format GeoJSON',
    description:
        'Renvoie une FeatureCollection GeoJSON, avec filtres optionnels combinables (recherche texte, ' +
        "nature du sol, type d'équipement, accès libre/payant, rectangle englobant).",
    request: {
        query: boulodromesQuerySchema
    },
    responses: {
        200: {
            description: 'FeatureCollection des boulodromes correspondant aux filtres',
            content: { 'application/json': { schema: BoulodromeFeatureCollectionSchema } }
        },
        400: {
            description: 'Paramètre de requête invalide (ex. bbox ou freeAccess mal formé)',
            content: { 'application/json': { schema: validationErrorSchema } }
        },
        500: {
            description: 'Erreur inattendue côté serveur',
            content: { 'application/json': { schema: errorSchema } }
        }
    }
})

registry.registerPath({
    method: 'get',
    path: '/api/boulodromes/{id}/cafes',
    summary: "Cafés/bars/pubs à proximité d'un boulodrome, au format GeoJSON",
    description:
        'Renvoie une FeatureCollection GeoJSON des cafés dans un rayon donné (200m par défaut) autour du ' +
        'boulodrome, triés du plus proche au plus loin, avec la distance en mètres dans les properties.',
    request: {
        params: boulodromeIdParamSchema,
        query: cafesNearBoulodromeQuerySchema
    },
    responses: {
        200: {
            description: 'FeatureCollection des cafés à proximité',
            content: { 'application/json': { schema: CafeFeatureCollectionSchema } }
        },
        400: {
            description: 'Paramètre de requête invalide (ex. radius non numérique ou négatif)',
            content: { 'application/json': { schema: validationErrorSchema } }
        },
        404: {
            description: 'Aucun boulodrome ne correspond à cet identifiant',
            content: { 'application/json': { schema: errorSchema } }
        },
        500: {
            description: 'Erreur inattendue côté serveur',
            content: { 'application/json': { schema: errorSchema } }
        }
    }
})

registry.registerPath({
    method: 'get',
    path: '/api/boulodromes/{id}/route',
    summary: 'Itinéraire à pied entre un point de départ et un boulodrome, au format GeoJSON',
    description:
        "Calcule l'itinéraire à pied via OpenRouteService et renvoie une unique Feature GeoJSON de géométrie " +
        'LineString, avec la distance (mètres) et la durée estimée (secondes) dans les properties.',
    request: {
        params: boulodromeIdParamSchema,
        query: routeQuerySchema
    },
    responses: {
        200: {
            description: 'Itinéraire calculé entre le point de départ et le boulodrome',
            content: { 'application/json': { schema: RouteFeatureSchema } }
        },
        400: {
            description: 'Paramètre de requête invalide (ex. from absent ou mal formé)',
            content: { 'application/json': { schema: validationErrorSchema } }
        },
        404: {
            description: 'Boulodrome inconnu, ou aucun itinéraire trouvé entre les deux points',
            content: { 'application/json': { schema: errorSchema } }
        },
        502: {
            description: 'OpenRouteService est indisponible, en timeout, ou renvoie une erreur',
            content: { 'application/json': { schema: errorSchema } }
        },
        500: {
            description: 'Erreur inattendue côté serveur',
            content: { 'application/json': { schema: errorSchema } }
        }
    }
})

registry.registerPath({
    method: 'get',
    path: '/api/geocode',
    summary: "Géocodage d'une adresse en liste de candidats",
    description:
        'Renvoie, via OpenRouteService, la liste des adresses correspondant à la recherche libre, triée par ' +
        "pertinence. Plusieurs candidats n'est pas une erreur : c'est au client de proposer un choix.",
    request: {
        query: geocodeQuerySchema
    },
    responses: {
        200: {
            description: 'Liste des adresses candidates correspondant à la recherche',
            content: { 'application/json': { schema: GeocodeCandidateListSchema } }
        },
        400: {
            description: 'Paramètre de requête invalide (q absent ou vide)',
            content: { 'application/json': { schema: validationErrorSchema } }
        },
        404: {
            description: 'Aucune adresse ne correspond à la recherche',
            content: { 'application/json': { schema: errorSchema } }
        },
        502: {
            description: 'OpenRouteService est indisponible, en timeout, ou renvoie une erreur',
            content: { 'application/json': { schema: errorSchema } }
        },
        500: {
            description: 'Erreur inattendue côté serveur',
            content: { 'application/json': { schema: errorSchema } }
        }
    }
})

registry.registerPath({
    method: 'get',
    path: '/health',
    summary: 'Healthcheck',
    responses: {
        200: {
            description: 'Le service répond',
            content: { 'text/plain': { schema: z.literal('ok') } }
        }
    }
})

export function generateOpenApiDocument() {
    const generator = new OpenApiGeneratorV31(registry.definitions)
    return generator.generateDocument({
        openapi: '3.1.0',
        info: {
            version: '1.0.0',
            title: 'API boulodromes de Paris',
            description: 'Boulodromes parisiens (open data equipements.sports.gouv.fr) au format GeoJSON, avec filtres.'
        }
    })
}
