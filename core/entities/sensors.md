# Sensors

Global [entities](../ontology.md#entity) representing the system's perception capabilities.

Sensors are shared infrastructure — any node can use any sensor. Unlike node-scoped entities, sensors belong to the network, not to a particular node.

---

## Schema

| Field | Description |
|-------|-------------|
| ID | Unique identifier (e.g., `finance`) |
| Name | Human-readable name |
| Version | Semantic version |
| Domain | Observation domain produced |
| Sources | Data sources handled |
| Observation Type | Type of observations produced |
| Description | What this sensor does |

---

## Registry

| ID | Name | Version | Domain | Sources | Observation Type |
|----|------|---------|--------|---------|------------------|
| finance | Finance Sensor | 1.0.0 | finance | chase_csv | transaction |

---

## Relationship to Nodes

Nodes declare which sensors they use via `sensors.yaml`:

```yaml
# nodes/personal/sensors.yaml
sensors:
  - finance
```

The sensor defines *how* to perceive. The node defines *where* observations land.

---

## Adding a Sensor

1. Create the sensor package in `sensors/{name}/`
2. Export a `SensorDescriptor` from `src/index.ts`
3. Add a row to the registry table above
4. Nodes can then enable it in their `sensors.yaml`
