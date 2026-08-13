import { describe, expect, it } from "vitest";
import { routeQuerySchema } from "./routeQuery";

function parse(query: Record<string, unknown>) {
  return routeQuerySchema.safeParse(query);
}

describe("routeQuerySchema - from", () => {
  it("parse une paire latitude,longitude valide", () => {
    const result = parse({ from: "48.8566,2.3522" });
    expect(result.success && result.data.from).toEqual({ latitude: 48.8566, longitude: 2.3522 });
  });

  it("rejette une valeur absente", () => {
    expect(parse({}).success).toBe(false);
  });

  it("rejette un nombre de valeurs incorrect", () => {
    expect(parse({ from: "48.8566" }).success).toBe(false);
    expect(parse({ from: "48.8566,2.3522,10" }).success).toBe(false);
  });

  it("rejette une valeur non numérique", () => {
    expect(parse({ from: "not-a-number,2.3522" }).success).toBe(false);
  });

  it("rejette un segment vide (Number(\"\") vaut 0, pas NaN)", () => {
    expect(parse({ from: "48.8566," }).success).toBe(false);
    expect(parse({ from: ",2.3522" }).success).toBe(false);
  });

  it("rejette des coordonnées hors limites", () => {
    expect(parse({ from: "91,2.3522" }).success).toBe(false);
    expect(parse({ from: "48.8566,181" }).success).toBe(false);
  });
});
