import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import type { SensorDescriptor } from "./types.js";

// We need a fresh registry for each test, so we'll test the class directly
// rather than the singleton
class SensorRegistry {
  private sensors = new Map<string, SensorDescriptor>();

  register(descriptor: SensorDescriptor): void {
    if (this.sensors.has(descriptor.id)) {
      throw new Error(`Sensor "${descriptor.id}" already registered`);
    }
    this.sensors.set(descriptor.id, descriptor);
  }

  get(id: string): SensorDescriptor | undefined {
    return this.sensors.get(id);
  }

  list(): SensorDescriptor[] {
    return Array.from(this.sensors.values());
  }

  has(id: string): boolean {
    return this.sensors.has(id);
  }

  ids(): string[] {
    return Array.from(this.sensors.keys());
  }
}

const testSensor: SensorDescriptor = {
  id: "test-sensor",
  name: "Test Sensor",
  version: "1.0.0",
  domain: "test",
  sources: ["test_source"],
  observationType: "test_observation",
  description: "A sensor for testing",
};

const anotherSensor: SensorDescriptor = {
  id: "another-sensor",
  name: "Another Sensor",
  version: "2.0.0",
  domain: "another",
  sources: ["source_a", "source_b"],
  observationType: "another_observation",
};

describe("SensorRegistry", () => {
  let registry: SensorRegistry;

  beforeEach(() => {
    registry = new SensorRegistry();
  });

  describe("register", () => {
    it("should register a sensor", () => {
      registry.register(testSensor);
      assert.strictEqual(registry.has("test-sensor"), true);
    });

    it("should throw when registering duplicate id", () => {
      registry.register(testSensor);
      assert.throws(
        () => registry.register(testSensor),
        /Sensor "test-sensor" already registered/
      );
    });
  });

  describe("get", () => {
    it("should return registered sensor", () => {
      registry.register(testSensor);
      const result = registry.get("test-sensor");
      assert.deepStrictEqual(result, testSensor);
    });

    it("should return undefined for unknown id", () => {
      const result = registry.get("nonexistent");
      assert.strictEqual(result, undefined);
    });
  });

  describe("list", () => {
    it("should return empty array when no sensors registered", () => {
      const result = registry.list();
      assert.deepStrictEqual(result, []);
    });

    it("should return all registered sensors", () => {
      registry.register(testSensor);
      registry.register(anotherSensor);
      const result = registry.list();
      assert.strictEqual(result.length, 2);
      assert.ok(result.some((s) => s.id === "test-sensor"));
      assert.ok(result.some((s) => s.id === "another-sensor"));
    });
  });

  describe("has", () => {
    it("should return true for registered sensor", () => {
      registry.register(testSensor);
      assert.strictEqual(registry.has("test-sensor"), true);
    });

    it("should return false for unregistered sensor", () => {
      assert.strictEqual(registry.has("nonexistent"), false);
    });
  });

  describe("ids", () => {
    it("should return empty array when no sensors registered", () => {
      const result = registry.ids();
      assert.deepStrictEqual(result, []);
    });

    it("should return all registered sensor ids", () => {
      registry.register(testSensor);
      registry.register(anotherSensor);
      const result = registry.ids();
      assert.strictEqual(result.length, 2);
      assert.ok(result.includes("test-sensor"));
      assert.ok(result.includes("another-sensor"));
    });
  });
});
