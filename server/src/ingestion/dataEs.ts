import { Address, Boulodrome, GeoCoordinates } from "../models/boulodrome";

// Raw shapes as returned by the "Data ES" Opendatasoft API
// (equipements.sports.gouv.fr, datasets data-es-equipement / data-es-installation).
export interface DataEsEquipementRecord {
  numero: string;
  nom: string;
  type: string;
  famille: string;
  installation_numero: string;
}

export interface DataEsInstallationRecord {
  numero: string;
  adresse: string;
  cp: string;
  commune: string;
  insee: string;
  coordonnees: { lon: number; lat: number };
}

const API_BASE = "https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets";
// Prefixe des "numero" d'installation en Île-de-France Paris intra-muros
// (I75xxxxxxx) : plus simple et plus fiable qu'un filtre sur le champ
// "commune" (libelles inconsistants, ex. "Paris 11e Arrondissement").
const PARIS_INSTALLATION_PREFIX = "I75";
const PAGE_SIZE = 100;
const INSTALLATION_CHUNK_SIZE = 40;

interface DataEsApiResponse<T> {
  total_count: number;
  results: T[];
}

async function fetchDataEsRecords<T>(datasetId: string, where: string): Promise<T[]> {
  const records: T[] = [];
  let offset = 0;

  while (true) {
    const url = `${API_BASE}/${datasetId}/records?where=${encodeURIComponent(where)}&limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Data ES API error (${response.status}) on ${datasetId}: ${await response.text()}`);
    }

    const body = (await response.json()) as DataEsApiResponse<T>;
    records.push(...body.results);
    offset += PAGE_SIZE;
    if (offset >= body.total_count) break;
  }

  return records;
}

// Le dataset "equipement" ne porte pas l'adresse/commune du site : on doit
// croiser avec le dataset "installation" (jointure faite cote client, l'API
// Data ES ne supporte pas de jointure serveur entre les deux datasets).
export async function fetchParisBoulodromes(): Promise<Boulodrome[]> {
  const equipements = await fetchDataEsRecords<DataEsEquipementRecord>(
    "data-es-equipement",
    `famille="Boulodrome" and startswith(installation_numero,"${PARIS_INSTALLATION_PREFIX}")`,
  );

  const installationNumeros = [...new Set(equipements.map((e) => e.installation_numero))];
  const installationsByNumero = new Map<string, DataEsInstallationRecord>();

  for (let i = 0; i < installationNumeros.length; i += INSTALLATION_CHUNK_SIZE) {
    const chunk = installationNumeros.slice(i, i + INSTALLATION_CHUNK_SIZE);
    const idsClause = chunk.map((id) => `"${id}"`).join(",");
    const installations = await fetchDataEsRecords<DataEsInstallationRecord>(
      "data-es-installation",
      `numero in (${idsClause})`,
    );
    for (const installation of installations) {
      installationsByNumero.set(installation.numero, installation);
    }
  }

  const boulodromes: Boulodrome[] = [];
  for (const equipement of equipements) {
    const installation = installationsByNumero.get(equipement.installation_numero);
    if (!installation) {
      // Incoherence cote API (installation manquante) : on ignore ce
      // boulodrome plutot que de faire echouer tout l'import.
      continue;
    }
    boulodromes.push(toBoulodrome(equipement, installation));
  }

  return boulodromes;
}

export function toBoulodrome(
  equipement: DataEsEquipementRecord,
  installation: DataEsInstallationRecord,
): Boulodrome {
  const address = new Address(
    installation.adresse,
    installation.cp,
    installation.commune,
    installation.insee,
  );
  const coordinates = new GeoCoordinates(
    installation.coordonnees.lat,
    installation.coordonnees.lon,
  );

  return new Boulodrome(
    `data-es:${equipement.numero}`,
    equipement.nom,
    address,
    coordinates,
    "data-es",
    equipement.numero,
    new Date(),
  );
}
