export type LogFields = Record<string, unknown>

type LogLevel = 'info' | 'error'

interface LogEntry extends LogFields {
    timestamp: string
    level: LogLevel
    message: string
}

// Une instance Error n'a pas de propriete enumerable (message/stack) -
// JSON.stringify(new Error('x')) vaut '{}' sans normalisation explicite, ce
// qui ferait disparaitre le detail de l'erreur dans le log.
function normalizeFieldValue(value: unknown): unknown {
    if (value instanceof Error) {
        return { name: value.name, message: value.message, stack: value.stack }
    }
    return value
}

function normalizeFields(fields: LogFields): LogFields {
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, normalizeFieldValue(value)]))
}

// JSON.stringify leve une exception sur une reference circulaire (deja vu
// sur des objets d'erreur reseau/driver) - la ligne de log elle-meme ne doit
// jamais faire planter l'appelant, notamment les handlers globaux
// uncaughtException/unhandledRejection (index.ts) qui doivent tolerer
// n'importe quelle forme de valeur sans jamais lever a leur tour.
function safeStringify(entry: LogEntry): string {
    try {
        return JSON.stringify(entry)
    } catch {
        return JSON.stringify({
            timestamp: entry.timestamp,
            level: entry.level,
            message: entry.message,
            serializationError: 'Champs additionnels non sérialisables (référence circulaire ou type non JSON)'
        })
    }
}

function write(level: LogLevel, message: string, fields: LogFields | undefined): void {
    const entry: LogEntry = {
        // Les champs appelants sont fusionnes avant les champs reserves
        // (timestamp/level/message), pour qu'un champ additionnel portant
        // par hasard l'une de ces cles ne puisse jamais l'ecraser.
        ...(fields ? normalizeFields(fields) : {}),
        timestamp: new Date().toISOString(),
        level,
        message
    }
    const line = safeStringify(entry)

    if (level === 'error') {
        console.error(line)
    } else {
        console.log(line)
    }
}

/**
 * Logger minimal, sans dépendance externe (pas de pino/winston à ce stade -
 * cf. `CLAUDE.md`, principe "pas de dépendance tant que le besoin ne s'en
 * fait pas sentir clairement"). Wrapper autour de `console` produisant une
 * ligne JSON structurée (timestamp + niveau + message + champs additionnels)
 * plutôt qu'une simple concaténation de chaîne - remplaçable plus tard par
 * une vraie librairie sans changer l'API appelante.
 */
export const logger = {
    /**
     * Journalise un évènement de niveau info.
     *
     * @param {string} message - Message décrivant l'évènement.
     * @param {LogFields} [fields] - Champs additionnels structurés (contexte).
     * @returns {void}
     */
    info(message: string, fields?: LogFields): void {
        write('info', message, fields)
    },

    /**
     * Journalise une erreur.
     *
     * @param {string} message - Message décrivant l'erreur.
     * @param {LogFields} [fields] - Champs additionnels structurés (ex. `{ error }`) ; les valeurs de type `Error` sont normalisées (name/message/stack) avant sérialisation.
     * @returns {void}
     */
    error(message: string, fields?: LogFields): void {
        write('error', message, fields)
    }
}
