// `siteName` egal a `name`, absent, ou blanc n'apporte rien a afficher en
// plus - garde partagee par la popup de boulodrome, le nom accessible de son
// marqueur (ticket 26) et l'historique de recherche (ticket 23), pour que
// les trois s'accordent sur quand l'afficher plutot que de dupliquer (et
// potentiellement faire diverger) la meme regle a trois endroits.
export function distinctSiteName(name: string, siteName: string | null): string | null {
  const trimmed = siteName?.trim();
  return trimmed && trimmed !== name ? trimmed : null;
}
