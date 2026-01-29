import { SensorDescriptor } from "./types.js";

/**
 * In-memory registry for sensor plugins.
 * Sensors register their descriptors here; nodes can query what's available.
 */
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

// Singleton instance
export const registry = new SensorRegistry();

// Convenience function for registration
export function registerSensor(descriptor: SensorDescriptor): void {
  registry.register(descriptor);
}
