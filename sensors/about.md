# About Sensors

Sensors are the system's organs of perception.

## Why Sensors Exist

The world generates data constantly—transactions, messages, measurements, moments. But raw data is not knowledge. It is noise until something listens, interprets, and remembers.

Sensors listen. They convert the chaos of external formats into observations the system can learn from.

## What a Sensor Does

A sensor has one job: *observe*.

It reads a specific external format—CSV, API, markdown. It normalizes what it finds into observations. It fingerprints each observation for identity. It stores them in memory.

A sensor does not analyze. It does not judge. It does not recommend. Those are later stages. The sensor's discipline is faithful perception.

## The Pattern

All sensors follow the same shape:
1. Parse raw input into domain-specific structures
2. Compute deterministic fingerprints (so re-ingestion is safe)
3. Store observations in the shared memory layer

The infrastructure lives in `core/sensor/`. The domain-specific implementations live here.

## Current Sensors

- **finance/** — Bank transactions become financial observations
- **thought/** — Inbox items become thought observations

## When to Build a Sensor

Build a sensor when:
- You have a recurring source of external data
- That data carries information you want the system to remember
- The memory should persist and be queryable

Do not build a sensor for one-time imports or data you will not revisit.
