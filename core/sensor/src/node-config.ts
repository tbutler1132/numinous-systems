import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import { join } from "path";

export interface NodeSensorConfig {
  sensors: string[];
}

export function loadNodeSensorConfig(nodePath: string): NodeSensorConfig {
  const configPath = join(nodePath, "sensors.yaml");

  if (!existsSync(configPath)) {
    return { sensors: [] };
  }

  const content = readFileSync(configPath, "utf-8");
  const parsed = parseYaml(content);

  return {
    sensors: parsed?.sensors ?? [],
  };
}

export function getNodeSensorConfigPath(nodePath: string): string {
  return join(nodePath, "sensors.yaml");
}
