# Sensors

The system's perception capabilities. A registry of [sensors](ontology.md#sensor) available to all nodes.

Sensors are shared infrastructure — any node can use any sensor. The sensor defines *how* to perceive; the node defines *where* observations land.

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

---

## Adding a Sensor

1. Create the sensor package in `sensors/{name}/`
2. Export a `SensorDescriptor` from `src/index.ts`
3. Add a row to the registry table above
4. Nodes can then enable it in their `sensors.yaml`

---

## Implementation

The shared infrastructure that makes sensing possible lives in [core/sensor/](sensor/about.md) — types, fingerprinting, and storage.
