import { describe, expect, it } from "vitest";
import { GeoCoordinates } from "../models/geo";
import { buildDirectionsRequestBody, RouteNotFoundError, toRouteFeature } from "./openRouteServiceClient";

describe("buildDirectionsRequestBody", () => {
  it("ordonne les coordonnées en [longitude, latitude], origine puis destination", () => {
    const origin = new GeoCoordinates(48.8566, 2.3522);
    const destination = new GeoCoordinates(48.86, 2.36);

    expect(buildDirectionsRequestBody(origin, destination)).toEqual({
      coordinates: [
        [2.3522, 48.8566],
        [2.36, 48.86],
      ],
    });
  });
});

describe("toRouteFeature", () => {
  it("mappe une réponse ORS vers une Feature GeoJSON LineString avec distance/durée arrondies", () => {
    const orsResponse = {
      features: [
        {
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [2.3522, 48.8566],
              [2.353, 48.857],
            ] as [number, number][],
          },
          properties: {
            summary: { distance: 845.7, duration: 639.2 },
          },
        },
      ],
    };

    const feature = toRouteFeature(orsResponse);

    expect(feature).toEqual({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [2.3522, 48.8566],
          [2.353, 48.857],
        ],
      },
      properties: {
        distanceMeters: 846,
        durationSeconds: 639,
      },
    });
  });

  it("lève RouteNotFoundError quand la réponse ne contient aucune feature", () => {
    expect(() => toRouteFeature({ features: [] })).toThrow(RouteNotFoundError);
  });
});
