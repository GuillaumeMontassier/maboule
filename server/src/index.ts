import process from 'node:process'
import { app } from './app'

process.on('uncaughtException', (error) => {
    console.error('uncaughtException', error)
    process.exit(1)
})

process.on('unhandledRejection', (error) => {
    console.error('unhandledRejection', error)
    process.exit(1)
})

const port = process.env.PORT ?? 3000

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})
