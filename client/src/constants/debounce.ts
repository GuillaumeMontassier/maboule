// Duree de debounce partagee par les deux seuls debounces de l'app (saisie de
// recherche dans BoulodromeSearch.tsx, pan/zoom de la carte dans
// BoundsWatcher.tsx) - une constante unique plutot que deux litteraux
// dupliques garantit que les deux restent coherents si cette valeur est un
// jour ajustee.
export const UI_DEBOUNCE_MS = 300
