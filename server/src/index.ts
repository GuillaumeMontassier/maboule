import process from 'node:process'
import { app } from './app'
import { logger } from './logger'

process.on('uncaughtException', (error) => {
    logger.error('uncaughtException', { error })
    process.exit(1)
})

process.on('unhandledRejection', (error) => {
    logger.error('unhandledRejection', { error })
    process.exit(1)
})

const port = process.env.PORT ?? 3000

app.listen(port, () => {
    logger.info('Serveur démarré', { port })
})
