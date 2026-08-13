import { useEffect, useRef, useState } from "react";
import { fetchRoute, type RouteFeature } from "../api/route";

type RouteState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; route: RouteFeature };

interface RoutePanelProps {
  boulodromeId: string;
  onRouteChange: (route: RouteFeature | null) => void;
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Géolocalisation refusée. Autorisez l'accès à votre position pour utiliser cette option.";
    case error.POSITION_UNAVAILABLE:
      return "Votre position n'a pas pu être déterminée.";
    case error.TIMEOUT:
      return "La récupération de votre position a pris trop de temps.";
    default:
      return "Impossible de récupérer votre position.";
  }
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)} km`;
  return `${Math.round(distanceMeters)} m`;
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  return `${minutes} min`;
}

export function RoutePanel({ boulodromeId, onRouteChange }: RoutePanelProps) {
  const [state, setState] = useState<RouteState>({ status: "idle" });
  // Le panneau est remonte (nouvelle instance, cf. `key` cote appelant) des
  // qu'un autre boulodrome est selectionne, mais les callbacks async de la
  // requete en cours pour l'ANCIENNE instance (geolocalisation, fetchRoute)
  // continuent de s'executer independamment du cycle de vie React - rien ne
  // les annule. Sans ce garde, une reponse tardive appellerait `onRouteChange`
  // (= `setRoute` sur BoulodromesMap, toujours monte) et redessinerait sur la
  // carte le trace de l'ancien boulodrome alors qu'un autre est maintenant
  // affiche dans le panneau.
  const isCurrent = useRef(true);

  useEffect(() => {
    isCurrent.current = true;
    return () => {
      isCurrent.current = false;
      onRouteChange(null);
    };
  }, [onRouteChange]);

  function handleUseMyLocation() {
    // Permission refusee ou geolocalisation non disponible : gere
    // entierement cote frontend, aucun appel reseau declenche (cf. spec).
    if (!("geolocation" in navigator)) {
      setState({
        status: "error",
        message: "La géolocalisation n'est pas disponible sur cet appareil.",
      });
      return;
    }

    setState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isCurrent.current) return;
        setState({ status: "loading" });
        fetchRoute(boulodromeId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
          .then((route) => {
            if (!isCurrent.current) return;
            setState({ status: "success", route });
            onRouteChange(route);
          })
          .catch((error: unknown) => {
            if (!isCurrent.current) return;
            const message = error instanceof Error ? error.message : "Erreur inconnue";
            setState({ status: "error", message });
            onRouteChange(null);
          });
      },
      (error) => {
        if (!isCurrent.current) return;
        setState({ status: "error", message: geolocationErrorMessage(error) });
        // Efface un trace deja affiche (ex. rafraichissement de position qui
        // echoue apres un premier calcul reussi) - le panneau et la carte ne
        // doivent pas se retrouver en desaccord sur l'existence d'un trace.
        onRouteChange(null);
      },
    );
  }

  return (
    <div className="route-panel">
      <h2>Itinéraire</h2>
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={state.status === "locating" || state.status === "loading"}
      >
        Utiliser ma position
      </button>
      {state.status === "locating" && (
        <p className="route-panel-status">Récupération de votre position…</p>
      )}
      {state.status === "loading" && <p className="route-panel-status">Calcul de l'itinéraire…</p>}
      {state.status === "error" && (
        <p className="route-panel-status status-error">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="route-panel-status">
          {formatDistance(state.route.properties.distanceMeters)} ·{" "}
          {formatDuration(state.route.properties.durationSeconds)} à pied
        </p>
      )}
    </div>
  );
}
