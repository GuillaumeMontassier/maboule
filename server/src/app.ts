import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { generateOpenApiDocument } from './openapi/document'
import { boulodromesRouter } from './routes/boulodromes.routes'
import { geocodeRouter } from './routes/geocode.routes'

export const app = express()

// Le front (Vercel) et le back (Railway) sont sur des domaines differents,
// donc CORS est necessaire meme en prod. CORS_ORIGIN restreint aux domaines
// listes une fois connus ; sans cette variable (dev local), on reste ouvert
// a toutes origines - endpoint public en lecture seule, sans authentification
// ni donnee sensible.
const corsOrigin = process.env.CORS_ORIGIN?.split(',')
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined))

app.get('/health', (_req, res) => {
    res.status(200).send('ok')
})

// Doc genere depuis les memes schemas Zod que la validation des routers -
// une seule source de verite, pas de doc a la main qui risque de diverger.
const openApiDocument = generateOpenApiDocument()
app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument)
})
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

app.use(boulodromesRouter)
app.use(geocodeRouter)
