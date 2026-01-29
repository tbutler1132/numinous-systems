/**
 * DNA Tripwire Tests
 *
 * These tests hardcode expected values for all DNA constants.
 * If any test fails, it means DNA has changed.
 *
 * This is intentional friction. Before updating these tests, ask:
 * - Is this change to the rules of the world, or just to one component?
 * - Have I updated about.md to reflect the change?
 * - What else might break?
 *
 * Changes to DNA are mutations. They should be rare and deliberate.
 */

import { describe, it, expect } from "vitest";
import {
  ACCESS_LEVELS,
  SURFACE_TYPES,
  SURFACE_KINDS,
  SURFACE_CATEGORIES,
  SURFACE_STATUSES,
  SURFACE_VISIBILITIES,
  LOCKED_BEHAVIORS,
  ARTIFACT_FILES,
  ARTIFACT_REQUIRED_FILES,
  REQUIRED_NODE_SURFACES,
  REQUIRED_NODE_ARTIFACTS,
  DNA_SCHEMA_VERSION,
  type Artifact,
  type ArtifactContent,
} from "./index.js";

describe("DNA Tripwire", () => {
  describe("Schema Version", () => {
    it("current version is 1", () => {
      expect(DNA_SCHEMA_VERSION).toBe(1);
    });
  });

  describe("Access Levels", () => {
    it("has exactly 5 levels in order", () => {
      expect(ACCESS_LEVELS).toEqual([
        "anonymous",
        "viewer",
        "supporter",
        "contributor",
        "collaborator",
      ]);
    });

    it("anonymous is lowest (index 0)", () => {
      expect(ACCESS_LEVELS[0]).toBe("anonymous");
    });

    it("collaborator is highest (index 4)", () => {
      expect(ACCESS_LEVELS[4]).toBe("collaborator");
    });
  });

  describe("Surface Types", () => {
    it("has exactly 2 types", () => {
      expect(SURFACE_TYPES).toEqual(["internal", "external"]);
    });
  });

  describe("Surface Kinds", () => {
    it("has exactly 2 kinds", () => {
      expect(SURFACE_KINDS).toEqual(["location", "device"]);
    });
  });

  describe("Surface Categories", () => {
    it("has exactly 2 categories", () => {
      expect(SURFACE_CATEGORIES).toEqual(["plaza", "exhibit"]);
    });
  });

  describe("Surface Statuses", () => {
    it("has exactly 2 statuses", () => {
      expect(SURFACE_STATUSES).toEqual(["active", "inactive"]);
    });
  });

  describe("Surface Visibilities", () => {
    it("has exactly 2 visibilities", () => {
      expect(SURFACE_VISIBILITIES).toEqual(["public", "private"]);
    });
  });

  describe("Locked Behaviors", () => {
    it("has exactly 2 behaviors", () => {
      expect(LOCKED_BEHAVIORS).toEqual(["hide", "show"]);
    });
  });

  describe("Artifact Structure", () => {
    it("has exactly 4 possible files", () => {
      expect(ARTIFACT_FILES).toEqual([
        "about.md",
        "notes.md",
        "page.md",
        "manifest.md",
      ]);
    });

    it("about.md is first (most important)", () => {
      expect(ARTIFACT_FILES[0]).toBe("about.md");
    });

    it("only about.md is required", () => {
      expect(ARTIFACT_REQUIRED_FILES).toEqual(["about.md"]);
    });

    // Type-level tests: these verify the shape of types at compile time
    // If the type changes, these will fail to compile
    it("ArtifactContent has metadata and body", () => {
      const content: ArtifactContent = {
        metadata: { title: "Test" },
        body: "# Test",
      };
      expect(content.metadata).toBeDefined();
      expect(content.body).toBeDefined();
    });

    it("Artifact has required fields", () => {
      const artifact: Artifact = {
        path: "/nodes/org/artifacts/test",
        slug: "test",
        nodeId: "org",
        about: { metadata: {}, body: "" },
      };
      expect(artifact.path).toBeDefined();
      expect(artifact.slug).toBeDefined();
      expect(artifact.nodeId).toBeDefined();
      expect(artifact.about).toBeDefined();
    });

    it("Artifact optional fields are truly optional", () => {
      const minimal: Artifact = {
        path: "/test",
        slug: "test",
        nodeId: "org",
        about: { metadata: {}, body: "" },
      };
      const full: Artifact = {
        path: "/test",
        slug: "test",
        nodeId: "org",
        about: { metadata: {}, body: "" },
        notes: { metadata: {}, body: "" },
        page: { metadata: {}, body: "" },
        manifest: { metadata: {}, body: "" },
      };
      expect(minimal.notes).toBeUndefined();
      expect(full.notes).toBeDefined();
    });
  });

  describe("Bootstrap Rules", () => {
    it("every node needs a home surface", () => {
      expect(REQUIRED_NODE_SURFACES).toEqual(["home"]);
    });

    it("every node needs a home artifact", () => {
      expect(REQUIRED_NODE_ARTIFACTS).toEqual(["home"]);
    });
  });
});
