# Meadow Connection Dgraph

A Fable service provider that connects applications to [Dgraph](https://dgraph.io), a distributed graph database. Wraps [dgraph-js-http](https://github.com/dgraph-io/dgraph-js-http) and integrates with the Meadow data layer through Fable's dependency injection system.

Dgraph stores data as a graph of nodes and edges, queried via DQL (Dgraph Query Language, formerly GraphQL+-). This provider manages the HTTP client connection and translates Meadow table schemas into Dgraph predicate declarations and type definitions.

## Install

```bash
npm install meadow-connection-dgraph
```

Requires a running Dgraph Alpha instance accessible over HTTP (default port 8080).

## Quick Start

### 1. Configure Fable

Add a `DGraph` section to your Fable configuration with the Dgraph Alpha host and port:

```javascript
const libFable = require('fable');

let _Fable = new libFable(
	{
		"Product": "MyApp",
		"DGraph":
		{
			"Server": "localhost",
			"Port": 8080
		}
	});
```

### 2. Register the Service

```javascript
const libMeadowConnectionDGraph = require('meadow-connection-dgraph');

_Fable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
_Fable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');
```

After instantiation the provider is available at `_Fable.MeadowDGraphProvider`.

### 3. Connect

```javascript
_Fable.MeadowDGraphProvider.connectAsync(
	(pError, pClient) =>
	{
		if (pError)
		{
			_Fable.log.error(`Connection failed: ${pError}`);
			return;
		}

		_Fable.log.info('Dgraph connected!');
	});
```

### 4. Query

Access the Dgraph client through the `pool` getter:

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;

// Run a DQL query
let tmpTxn = tmpClient.newTxn({ readOnly: true });
tmpTxn.query('{ animals(func: type(Animal)) { uid Name Age Weight } }')
	.then((pResponse) =>
	{
		console.log(pResponse.data);
	});
```

## Configuration

The provider reads settings from two sources, in order of priority:

1. **Constructor options** -- passed as the second argument to `instantiateServiceProvider()`
2. **Fable settings** -- `fable.settings.DGraph`

| Setting | Alias | Type | Default | Description |
|---------|-------|------|---------|-------------|
| `Server` | `host` | string | `'localhost'` | Dgraph Alpha hostname or IP |
| `Port` | `port` | number | `8080` | Dgraph Alpha HTTP port |
| `AuthToken` | `authToken` | string | `''` | Optional Alpha auth token |

Both Meadow-style (`Server`, `Port`, `AuthToken`) and lowercase (`host`, `port`, `authToken`) property names are supported.

### Auth Token

For secured Dgraph clusters, provide an Alpha auth token:

```javascript
let _Fable = new libFable(
	{
		"DGraph":
		{
			"Server": "dgraph.example.com",
			"Port": 8080,
			"AuthToken": "your-alpha-auth-token"
		}
	});
```

The token is applied via `client.setAlphaAuthToken()` during connection.

## How It Works

```
┌─────────────────────────────┐
│  Fable Application          │
│                             │
│  fable.settings.DGraph      │
│   ├── Server                │
│   ├── Port                  │
│   └── AuthToken             │
└───────────┬─────────────────┘
            │ connectAsync()
            ▼
┌─────────────────────────────┐
│  MeadowConnectionDGraph     │
│  (Fable Service Provider)   │
│                             │
│  .connected                 │
│  .pool ─────────────────┐   │
│  .stub                  │   │
└─────────────────────────┼───┘
                          │
            ┌─────────────▼───────────┐
            │  dgraph-js-http         │
            │                         │
            │  client.newTxn()        │
            │    .query(dql)          │
            │    .mutate(mutation)    │
            │    .commit()            │
            │  client.alter(schema)   │
            └─────────────────────────┘
                          │
            ┌─────────────▼───────────┐
            │  Dgraph Alpha (HTTP)    │
            └─────────────────────────┘
```

The provider manages the client lifecycle and exposes the `dgraph-js-http` client. All queries, mutations, and schema alterations go through the Dgraph client's transaction and alter APIs.

## Learn More

- [Quickstart Guide](quickstart.md) -- Step-by-step walkthrough from install to schema creation
- [Architecture & Design](architecture.md) -- Connection lifecycle and data flow diagrams
- [Schema & Predicates](schema.md) -- Predicate type mapping and DDL generation
- [API Reference](api/reference.md) -- Complete reference for every property and method

## Companion Modules

| Module | Purpose |
|--------|---------|
| [Meadow](/meadow/meadow/) | ORM and data access layer |
| [FoxHound](/meadow/foxhound/) | Query DSL and SQL generation |
| [meadow-connection-mysql](/meadow/meadow-connection-mysql/) | MySQL connection provider |
| [meadow-connection-mssql](/meadow/meadow-connection-mssql/) | MSSQL connection provider |
| [meadow-connection-sqlite](/meadow/meadow-connection-sqlite/) | SQLite connection provider |
| [meadow-connection-rocksdb](/meadow/meadow-connection-rocksdb/) | RocksDB key-value provider |
