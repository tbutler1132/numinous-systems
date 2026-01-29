# About Sensors

Sensors are the system's organs of perception.

## Why Sensors Exist

The world generates data constantly—transactions, messages, measurements, moments. But raw data is not knowledge. It is noise until something listens, interprets, and remembers.

Sensors listen. They convert the chaos of external formats into observations the system can learn from.

## What a Sensor Does

A sensor has one job: *observe*.

It reads a specific external format—CSV, API, markdown. It normalizes what it finds into observations. It declares what makes each observation unique. Memory handles the rest.

A sensor does not analyze. It does not judge. It does not recommend. Those are later stages. The sensor's discipline is faithful perception.

## The Pattern

All sensors follow the same shape:
1. Parse raw input into domain-specific structures
2. Declare identity fields (what makes an observation unique)
3. Pass observations to Memory, which computes fingerprints and stores them

```typescript
// Sensor declares what matters for identity
const observation = {
  identity: {
    values: [observed_at, amount_cents, description_norm, account_label]
  },
  domain: "finance",
  source: "chase_csv",
  type: "transaction",
  payload: { ... },
  // ...
};

// Memory computes fingerprint and stores
store.insertObservations([observation]);
```

The sensor knows *what* defines uniqueness (domain knowledge). Memory knows *how* to compute identity (mechanical hashing). This separation keeps concerns clean.

The infrastructure lives in `core/sensor/` and `core/memory/`. The domain-specific implementations live here.

## Current Sensors

- **finance/** — Bank transactions become financial observations
- **thought/** — Inbox markdown entries become thought observations

## When to Build a Sensor

Build a sensor when:
- You have a recurring source of external data
- That data carries information you want the system to remember
- The memory should persist and be queryable

Do not build a sensor for one-time imports or data you will not revisit.

## Plugin Architecture

Sensors and nodes are orthogonal. Sensors define perception capabilities. Nodes define storage contexts. Any node can use any sensor. The connection is declared, not hardcoded.

### Sensor Manifests

Each sensor exports a `SensorDescriptor`:

```typescript
import { sensor } from '@numinous-systems/finance';

// sensor.id = 'finance'
// sensor.domain = 'finance'
// sensor.sources = ['chase_csv']
```

### Registry

Sensors register with a shared registry:

```typescript
import { registerSensor, registry } from '@numinous-systems/sensor';
import { sensor } from '@numinous-systems/finance';

registerSensor(sensor);
registry.list();  // all registered sensors
```

### Node Configuration

Nodes declare which sensors they use in `sensors.yaml`:

```yaml
# nodes/personal/sensors.yaml
sensors:
  - finance
```

This makes the relationship explicit and inspectable.
