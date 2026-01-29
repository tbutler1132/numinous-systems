import { describe, it, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadNodeSensorConfig, getNodeSensorConfigPath } from "./node-config.js";

describe("loadNodeSensorConfig", () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should return empty sensors array when no config file exists", () => {
    tempDir = mkdtempSync(join(tmpdir(), "sensor-test-"));
    const result = loadNodeSensorConfig(tempDir);
    assert.deepStrictEqual(result, { sensors: [] });
  });

  it("should load sensors from yaml file", () => {
    tempDir = mkdtempSync(join(tmpdir(), "sensor-test-"));
    const configPath = join(tempDir, "sensors.yaml");
    writeFileSync(
      configPath,
      `# Sensors for this node
sensors:
  - finance
  - health
`
    );

    const result = loadNodeSensorConfig(tempDir);
    assert.deepStrictEqual(result, { sensors: ["finance", "health"] });
  });

  it("should handle single sensor", () => {
    tempDir = mkdtempSync(join(tmpdir(), "sensor-test-"));
    const configPath = join(tempDir, "sensors.yaml");
    writeFileSync(
      configPath,
      `sensors:
  - finance
`
    );

    const result = loadNodeSensorConfig(tempDir);
    assert.deepStrictEqual(result, { sensors: ["finance"] });
  });

  it("should return empty array for empty sensors list", () => {
    tempDir = mkdtempSync(join(tmpdir(), "sensor-test-"));
    const configPath = join(tempDir, "sensors.yaml");
    writeFileSync(configPath, `sensors: []`);

    const result = loadNodeSensorConfig(tempDir);
    assert.deepStrictEqual(result, { sensors: [] });
  });

  it("should return empty array when sensors key is missing", () => {
    tempDir = mkdtempSync(join(tmpdir(), "sensor-test-"));
    const configPath = join(tempDir, "sensors.yaml");
    writeFileSync(configPath, `other_key: value`);

    const result = loadNodeSensorConfig(tempDir);
    assert.deepStrictEqual(result, { sensors: [] });
  });

  it("should return empty array for empty file", () => {
    tempDir = mkdtempSync(join(tmpdir(), "sensor-test-"));
    const configPath = join(tempDir, "sensors.yaml");
    writeFileSync(configPath, ``);

    const result = loadNodeSensorConfig(tempDir);
    assert.deepStrictEqual(result, { sensors: [] });
  });
});

describe("getNodeSensorConfigPath", () => {
  it("should return path to sensors.yaml in node directory", () => {
    const result = getNodeSensorConfigPath("/path/to/node");
    assert.strictEqual(result, "/path/to/node/sensors.yaml");
  });

  it("should handle trailing slash", () => {
    const result = getNodeSensorConfigPath("/path/to/node/");
    // join normalizes the path
    assert.ok(result.endsWith("sensors.yaml"));
  });
});
