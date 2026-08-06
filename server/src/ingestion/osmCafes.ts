import { Cafe, type CafeAmenityType } from "../models/cafe";
import { Address, GeoCoordinates } from "../models/geo";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

interface OverpassNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassNode[];
}

// area["admin_level"="8"] = perimetre administratif de la commune de Paris
// (plus fiable qu'une bounding box qui deborderait sur la petite couronne).
// `["name"]` exclut les points sans nom : un cafe anonyme n'est pas
// affichable/identifiable pour l'utilisateur, autant l'ignorer a l'import.
const OVERPASS_QUERY = `
  [out:json][timeout:25];
  area["name"="Paris"]["admin_level"="8"]->.paris;
  (
    node["amenity"~"^(cafe|bar|pub)$"]["name"](area.paris);
  );
  out body;
`;

export async function fetchParisCafes(): Promise<Cafe[]> {
  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Overpass renvoie 406 sans User-Agent identifiant l'appelant - exige
      // par leur politique d'usage (https://wiki.openstreetmap.org/wiki/Overpass_API#Introduction).
      "User-Agent": "maboule-app/1.0 (+https://github.com/GuillaumeMontassier/maboule)",
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as OverpassResponse;
  return body.elements.map(toCafe);
}

export function toCafe(node: OverpassNode): Cafe {
  return new Cafe(
    `osm:node/${node.id}`,
    node.tags.name,
    node.tags.amenity as CafeAmenityType,
    new GeoCoordinates(node.lat, node.lon),
    "osm",
    String(node.id),
    new Date(),
    toAddress(node.tags),
  );
}

// Les tags `addr:*` vont ensemble ou pas du tout en pratique dans OSM :
// on ne reconstruit une Address que si les trois champs cles sont presents,
// plutot que de mixer donnee reelle et valeurs manquantes.
function toAddress(tags: Record<string, string>): Address | null {
  const street = tags["addr:street"];
  const postalCode = tags["addr:postcode"];
  const city = tags["addr:city"];
  if (!street || !postalCode || !city) {
    return null;
  }

  const housenumber = tags["addr:housenumber"];
  return new Address(housenumber ? `${housenumber} ${street}` : street, postalCode, city);
}
