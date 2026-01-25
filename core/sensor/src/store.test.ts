import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { ObservationStore, resolveDbPath } from "./store.js";
import { fingerprint } from "./fingerprint.js";
import type { Observation } from "./types.js";

const TEST_DIR = "/tmp/sensor-test";
const TEST_DB = `${TEST_DIR}/test.db`;

function makeObservation(overrides: Partial<Observation> = {}): Observation {
  const base = {
    id: fingerprint(["test", Date.now().toString(), Math.random().toString()]),
    observed_at: "2026-01-15",
    domain: "test",
    source: "test_source",
    type: "test_type",
    schema_version: 1,
    payload: { value: 42 },
    ingested_at: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

describe("ObservationStore", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("create", () => {
    it("should create a new database if none exists", async () => {
      const store = await ObservationStore.create(TEST_DB);
      assert.ok(store);
      store.close();
      assert.ok(existsSync(TEST_DB));
    });

    it("should open an existing database", async () => {
      // Create and close
      const store1 = await ObservationStore.create(TEST_DB);
      const obs = makeObservation({ id: "persistent-id" });
      store1.insertObservations([obs]);
      store1.close();

      // Reopen and verify data persisted
      const store2 = await ObservationStore.create(TEST_DB);
      const results = store2.queryObservations({ domain: "test" });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, "persistent-id");
      store2.close();
    });

    it("should create directory if it does not exist", async () => {
      const nestedPath = `${TEST_DIR}/nested/deep/test.db`;
      const store = await ObservationStore.create(nestedPath);
      store.close();
      assert.ok(existsSync(nestedPath));
    });
  });

  describe("insertObservations", () => {
    it("should insert observations", async () => {
      const store = await ObservationStore.create(TEST_DB);
      const obs = makeObservation();

      const result = store.insertObservations([obs]);

      assert.strictEqual(result.inserted, 1);
      assert.strictEqual(result.skipped, 0);
      assert.deepStrictEqual(result.warnings, []);
      store.close();
    });

    it("should skip duplicate observations (idempotent)", async () => {
      const store = await ObservationStore.create(TEST_DB);
      const obs = makeObservation({ id: "duplicate-id" });

      store.insertObservations([obs]);
      const result = store.insertObservations([obs]);

      assert.strictEqual(result.inserted, 0);
      assert.strictEqual(result.skipped, 1);
      store.close();
    });

    it("should detect collisions when same fingerprint but different source data", async () => {
      const store = await ObservationStore.create(TEST_DB);
      const id = "collision-id";

      // First insert with source row hash
      const obs1 = makeObservation({
        id,
        payload: { value: 1, source_row_hash: "hash-a" },
      });
      store.insertObservations([obs1], {
        sourceRowHashes: new Map([[id, "hash-a"]]),
      });

      // Second insert with different source row hash
      const obs2 = makeObservation({
        id,
        payload: { value: 2, source_row_hash: "hash-b" },
      });
      const result = store.insertObservations([obs2], {
        sourceRowHashes: new Map([[id, "hash-b"]]),
      });

      assert.strictEqual(result.skipped, 1);
      assert.strictEqual(result.warnings.length, 1);
      assert.ok(result.warnings[0].message.includes("different raw data"));
      store.close();
    });

    it("should respect saveOnInsert option", async () => {
      const store = await ObservationStore.create(TEST_DB);
      const obs = makeObservation({ id: "no-auto-save" });

      store.insertObservations([obs], { saveOnInsert: false });

      // Data is in memory but not persisted yet
      const inMemory = store.queryObservations({ domain: "test" });
      assert.strictEqual(inMemory.length, 1);

      // Manually save and close
      store.save();
      store.close();

      // Verify it persisted
      const store2 = await ObservationStore.create(TEST_DB);
      const results = store2.queryObservations({ domain: "test" });
      assert.strictEqual(results.length, 1);
      store2.close();
    });
  });

  describe("queryObservations", () => {
    it("should return all observations when no filter", async () => {
      const store = await ObservationStore.create(TEST_DB);
      store.insertObservations([
        makeObservation({ domain: "a" }),
        makeObservation({ domain: "b" }),
      ]);

      const results = store.queryObservations();

      assert.strictEqual(results.length, 2);
      store.close();
    });

    it("should filter by domain", async () => {
      const store = await ObservationStore.create(TEST_DB);
      store.insertObservations([
        makeObservation({ domain: "finance" }),
        makeObservation({ domain: "health" }),
      ]);

      const results = store.queryObservations({ domain: "finance" });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].domain, "finance");
      store.close();
    });

    it("should filter by type", async () => {
      const store = await ObservationStore.create(TEST_DB);
      store.insertObservations([
        makeObservation({ type: "transaction" }),
        makeObservation({ type: "sleep" }),
      ]);

      const results = store.queryObservations({ type: "transaction" });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].type, "transaction");
      store.close();
    });

    it("should filter by date range", async () => {
      const store = await ObservationStore.create(TEST_DB);
      store.insertObservations([
        makeObservation({ observed_at: "2026-01-01" }),
        makeObservation({ observed_at: "2026-01-15" }),
        makeObservation({ observed_at: "2026-01-31" }),
      ]);

      const results = store.queryObservations({
        since: "2026-01-10",
        until: "2026-01-20",
      });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].observed_at, "2026-01-15");
      store.close();
    });

    it("should respect limit", async () => {
      const store = await ObservationStore.create(TEST_DB);
      store.insertObservations([
        makeObservation({ observed_at: "2026-01-01" }),
        makeObservation({ observed_at: "2026-01-02" }),
        makeObservation({ observed_at: "2026-01-03" }),
      ]);

      const results = store.queryObservations({ limit: 2 });

      assert.strictEqual(results.length, 2);
      // Should be ordered by observed_at DESC
      assert.strictEqual(results[0].observed_at, "2026-01-03");
      store.close();
    });

    it("should parse payload JSON", async () => {
      const store = await ObservationStore.create(TEST_DB);
      const payload = { amount: 100, description: "test" };
      store.insertObservations([makeObservation({ payload })]);

      const results = store.queryObservations();

      assert.deepStrictEqual(results[0].payload, payload);
      store.close();
    });
  });

  describe("ingest runs", () => {
    it("should start and finish an ingest run", async () => {
      const store = await ObservationStore.create(TEST_DB);

      const runId = store.startIngestRun("/path/to/file.csv", "finance");

      const running = store.getIngestRun(runId);
      assert.ok(running);
      assert.strictEqual(running.status, "running");
      assert.strictEqual(running.source_file, "/path/to/file.csv");
      assert.strictEqual(running.domain, "finance");

      store.finishIngestRun(runId, {
        rowsRead: 100,
        rowsInserted: 95,
        rowsSkipped: 5,
        minObserved: "2026-01-01",
        maxObserved: "2026-01-15",
        status: "success",
      });

      const finished = store.getIngestRun(runId);
      assert.ok(finished);
      assert.strictEqual(finished.status, "success");
      assert.strictEqual(finished.rows_read, 100);
      assert.strictEqual(finished.rows_inserted, 95);
      assert.strictEqual(finished.rows_skipped, 5);
      assert.ok(finished.finished_at);
      store.close();
    });

    it("should return null for non-existent run", async () => {
      const store = await ObservationStore.create(TEST_DB);

      const run = store.getIngestRun("non-existent-id");

      assert.strictEqual(run, null);
      store.close();
    });
  });

  describe("getCounts", () => {
    it("should return counts by domain", async () => {
      const store = await ObservationStore.create(TEST_DB);
      store.insertObservations([
        makeObservation({ domain: "finance" }),
        makeObservation({ domain: "finance" }),
        makeObservation({ domain: "health" }),
      ]);

      const counts = store.getCounts();

      assert.strictEqual(counts["finance"], 2);
      assert.strictEqual(counts["health"], 1);
      store.close();
    });

    it("should return empty object for empty database", async () => {
      const store = await ObservationStore.create(TEST_DB);

      const counts = store.getCounts();

      assert.deepStrictEqual(counts, {});
      store.close();
    });
  });
});

describe("resolveDbPath", () => {
  it("should resolve path for a regular node", () => {
    const path = resolveDbPath("/workspace", "org");
    assert.strictEqual(path, "/workspace/nodes/org/data/observations.db");
  });

  it("should resolve private to nodes/org/private/", () => {
    const path = resolveDbPath("/workspace", "private");
    assert.strictEqual(path, "/workspace/nodes/org/private/data/observations.db");
  });
});
