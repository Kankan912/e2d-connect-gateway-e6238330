import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSOCIATION_SLUG,
  resolvePublicSlug,
  slugFromHost,
  slugFromLocation,
} from "./tenantScope";
import { normalizeSubdomain, subdomainPreview, validateSubdomain } from "./subdomain";

describe("slugFromHost", () => {
  it("reconnaît un sous-domaine d'association", () => {
    expect(slugFromHost("phoenix.mondomaine.com")).toBe("phoenix");
    expect(slugFromHost("phoenix.mondomaine.com:443")).toBe("phoenix");
  });

  it("ignore les préfixes techniques", () => {
    expect(slugFromHost("www.mondomaine.com")).toBeNull();
    expect(slugFromHost("app.mondomaine.com")).toBeNull();
    expect(slugFromHost("id-preview--abc.lovable.app")).toBeNull();
  });

  it("ignore les hôtes sans sous-domaine, les IP et localhost", () => {
    expect(slugFromHost("mondomaine.com")).toBeNull();
    expect(slugFromHost("127.0.0.1:8080")).toBeNull();
    expect(slugFromHost("localhost:8080")).toBeNull();
  });
});

describe("slugFromLocation", () => {
  it("lit /s/:slug et ?asso=", () => {
    expect(slugFromLocation("/s/phoenix", "")).toBe("phoenix");
    expect(slugFromLocation("/", "?asso=E2D")).toBe("e2d");
    expect(slugFromLocation("/dashboard", "")).toBeNull();
  });
});

describe("resolvePublicSlug", () => {
  it("donne la priorité à l'URL, puis au sous-domaine, puis au défaut", () => {
    expect(
      resolvePublicSlug({ host: "phoenix.mondomaine.com", pathname: "/s/e2d", search: "" }),
    ).toBe("e2d");
    expect(resolvePublicSlug({ host: "phoenix.mondomaine.com", pathname: "/", search: "" })).toBe(
      "phoenix",
    );
    expect(resolvePublicSlug({ host: "mondomaine.com", pathname: "/", search: "" })).toBe(
      DEFAULT_ASSOCIATION_SLUG,
    );
  });
});

describe("validateSubdomain", () => {
  it("accepte un sous-domaine correct", () => {
    expect(validateSubdomain("phoenix").valid).toBe(true);
  });

  it("refuse format invalide, mot réservé et doublon", () => {
    expect(validateSubdomain("Phoe nix").valid).toBe(false);
    expect(validateSubdomain("-phoenix").valid).toBe(false);
    expect(validateSubdomain("www").valid).toBe(false);
    expect(validateSubdomain("phoenix", { existing: ["phoenix"] }).valid).toBe(false);
  });

  it("accepte le vide sauf si obligatoire", () => {
    expect(validateSubdomain("").valid).toBe(true);
    expect(validateSubdomain("", { allowEmpty: false }).valid).toBe(false);
  });
});

describe("normalizeSubdomain / subdomainPreview", () => {
  it("normalise les accents et séparateurs", () => {
    expect(normalizeSubdomain("Équipe Phœnix!")).toBe("equipe-ph-nix");
  });

  it("compose l'adresse avec le slug en repli", () => {
    expect(subdomainPreview("", "e2d")).toContain("e2d.");
  });
});
