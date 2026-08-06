import { describe, expect, it } from "vitest";
import {
  parseBooleanParam,
  parseBoundingBoxParam,
  parseListParam,
  parseSearchParam,
} from "./queryParams";

describe("parseSearchParam", () => {
  it("retourne la chaîne trimée quand elle est non vide", () => {
    expect(parseSearchParam("  arsenal  ")).toBe("arsenal");
  });

  it("retourne undefined quand la valeur est absente", () => {
    expect(parseSearchParam(undefined)).toBeUndefined();
  });

  it("retourne undefined quand la valeur est vide ou faite d'espaces", () => {
    expect(parseSearchParam("")).toBeUndefined();
    expect(parseSearchParam("   ")).toBeUndefined();
  });

  it("retourne undefined quand la valeur n'est pas une chaîne (ex. tableau)", () => {
    expect(parseSearchParam(["arsenal", "vincennes"])).toBeUndefined();
  });
});

describe("parseListParam", () => {
  it("retourne undefined quand la valeur est absente", () => {
    expect(parseListParam(undefined)).toBeUndefined();
  });

  it("transforme une valeur unique en tableau à un élément", () => {
    expect(parseListParam("Sable")).toEqual(["Sable"]);
  });

  it("découpe une liste séparée par des virgules", () => {
    expect(parseListParam("Sable,Stabilisé/cendrée")).toEqual(["Sable", "Stabilisé/cendrée"]);
  });

  it("aplatit un tableau de valeurs (répétition du paramètre)", () => {
    expect(parseListParam(["Sable", "Stabilisé/cendrée"])).toEqual(["Sable", "Stabilisé/cendrée"]);
  });

  it("trim les valeurs et ignore les entrées vides", () => {
    expect(parseListParam(" Sable , , Stabilisé/cendrée ")).toEqual(["Sable", "Stabilisé/cendrée"]);
  });

  it("retourne undefined quand toutes les valeurs sont vides", () => {
    expect(parseListParam(",, ,")).toBeUndefined();
  });

  it("ignore les valeurs qui ne sont pas des chaînes", () => {
    expect(parseListParam([undefined, "Sable"] as unknown[])).toEqual(["Sable"]);
  });
});

describe("parseBooleanParam", () => {
  it('retourne true pour "true"', () => {
    expect(parseBooleanParam("true")).toBe(true);
  });

  it('retourne false pour "false"', () => {
    expect(parseBooleanParam("false")).toBe(false);
  });

  it("retourne undefined pour une valeur absente ou mal formée", () => {
    expect(parseBooleanParam(undefined)).toBeUndefined();
    expect(parseBooleanParam("")).toBeUndefined();
    expect(parseBooleanParam("yes")).toBeUndefined();
    expect(parseBooleanParam(["true"])).toBeUndefined();
  });
});

describe("parseBoundingBoxParam", () => {
  it("parse un bbox valide west,south,east,north", () => {
    expect(parseBoundingBoxParam("2.2,48.8,2.5,48.9")).toEqual({
      west: 2.2,
      south: 48.8,
      east: 2.5,
      north: 48.9,
    });
  });

  it("retourne undefined quand la valeur est absente ou n'est pas une chaîne", () => {
    expect(parseBoundingBoxParam(undefined)).toBeUndefined();
    expect(parseBoundingBoxParam(["2.2,48.8,2.5,48.9"])).toBeUndefined();
  });

  it("retourne undefined quand il n'y a pas exactement 4 valeurs", () => {
    expect(parseBoundingBoxParam("2.2,48.8,2.5")).toBeUndefined();
    expect(parseBoundingBoxParam("2.2,48.8,2.5,48.9,1")).toBeUndefined();
  });

  it("retourne undefined quand une valeur n'est pas un nombre", () => {
    expect(parseBoundingBoxParam("2.2,not-a-number,2.5,48.9")).toBeUndefined();
  });

  it("retourne undefined pour un rectangle dégénéré (west >= east ou south >= north)", () => {
    expect(parseBoundingBoxParam("2.5,48.8,2.2,48.9")).toBeUndefined();
    expect(parseBoundingBoxParam("2.2,48.9,2.5,48.8")).toBeUndefined();
  });
});
