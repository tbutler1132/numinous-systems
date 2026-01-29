import type { SensorDescriptor } from "@numinous-systems/sensor";

export const sensor: SensorDescriptor = {
  id: "finance",
  name: "Finance Sensor",
  version: "1.0.0",
  domain: "finance",
  sources: ["chase_csv"],
  observationType: "transaction",
  description: "Parses bank statements into financial observations",
};

export * from "./types.js";
export * from "./fingerprint.js";
export * from "./chase-csv.js";
