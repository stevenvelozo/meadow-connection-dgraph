# API Reference

Complete reference for `MeadowConnectionDGraph`, the Dgraph database connection provider for the Meadow data layer.

---

## Class: MeadowConnectionDGraph

Extends `fable-serviceproviderbase`. Manages an HTTP client connection to a Dgraph Alpha instance through the [dgraph-js-http](https://github.com/dgraph-io/dgraph-js-http) library.

### Constructor

```javascript
new MeadowConnectionDGraph(pFable, pManifest, pServiceHash)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `pFable` | object | A Fable instance |
| `pManifest` | object | Service manifest / options (optional) |
| `pServiceHash` | string | Service identifier |

On construction:

- Sets `serviceType` to `'MeadowConnectionDGraph'`
- Sets `connected` to `false`
- Reads `DGraph` settings from options or `fable.settings.DGraph`
- Normalizes Meadow-style property names (`Server`→`host`, `Port`→`port`, `AuthToken`→`authToken`)
- Defaults host to `'localhost'`, port to `8080`
- Optionally auto-connects if `MeadowConnectionDGraphAutoConnect` is `true`

The provider is not connected after construction unless auto-connect is enabled.

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| [`connected`](#connected) | `boolean` | Whether the Dgraph client has been established |
| [`pool`](pool.md) | `DgraphClient \| false` | The Dgraph client instance |
| [`stub`](stub.md) | `DgraphClientStub \| false` | The raw HTTP client stub |
| [`serviceType`](#servicetype) | `string` | Always `'MeadowConnectionDGraph'` |

### connected

Whether the Dgraph client has been established.

**Type:** `boolean`

```javascript
if (_Fable.MeadowDGraphProvider.connected)
{
	// Safe to use pool
}
```

### serviceType

Always `'MeadowConnectionDGraph'`.

**Type:** `string`

---

## Connection Methods

| Method | Description |
|--------|-------------|
| [`connectAsync(fCallback)`](connectAsync.md) | Connect with callback notification (recommended) |
| [`connect()`](connect.md) | Synchronous connection method |

---

## Schema Methods

| Method | Description |
|--------|-------------|
| [`generateCreateTableStatement(pSchema)`](generateCreateTableStatement.md) | Generate Dgraph predicate declarations and type definition |
| [`createTable(pSchema, fCallback)`](createTable.md) | Generate and apply schema via `client.alter()` |
| [`createTables(pSchema, fCallback)`](createTables.md) | Apply multiple schemas sequentially |
| [`generateDropTableStatement(pTableName)`](generateDropTableStatement.md) | Generate a drop type descriptor |

---

## Configuration

### Fable Settings

```json
{
	"DGraph":
	{
		"Server": "localhost",
		"Port": 8080,
		"AuthToken": ""
	}
}
```

### Constructor Options

```javascript
fable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider',
	{
		DGraph:
		{
			host: 'dgraph.example.com',
			port: 9080,
			authToken: 'your-token'
		}
	});
```

### Settings Reference

| Setting | Alias | Type | Default | Description |
|---------|-------|------|---------|-------------|
| `DGraph.Server` | `DGraph.host` | string | `'localhost'` | Dgraph Alpha hostname or IP |
| `DGraph.Port` | `DGraph.port` | number | `8080` | Dgraph Alpha HTTP port |
| `DGraph.AuthToken` | `DGraph.authToken` | string | `''` | Optional Alpha auth token |
| `MeadowConnectionDGraphAutoConnect` | — | boolean | `false` | Auto-connect on instantiation |

Constructor options override Fable settings. Both Meadow-style (`Server`) and lowercase (`host`) property names are accepted.

---

## Connection URL

The provider builds an HTTP URL from the configured host and port:

```
http://<host>:<port>
```

Default: `http://localhost:8080`

---

## Auth Token

When `AuthToken` is provided, the provider calls `client.setAlphaAuthToken(token)` after creating the client. This is required for Dgraph clusters with ACL (Access Control List) enabled.

---

## Predicate Type Mapping

Used by `generateCreateTableStatement()`:

| Meadow DataType | Dgraph Type | Index Directive |
|-----------------|-------------|-----------------|
| `ID` | `int` | `@index(int)` |
| `GUID` | `string` | `@index(exact)` |
| `ForeignKey` | `int` | `@index(int)` |
| `Numeric` | `int` | `@index(int)` |
| `Decimal` | `float` | `@index(float)` |
| `String` | `string` | `@index(exact, term)` |
| `Text` | `string` | `@index(fulltext)` |
| `DateTime` | `datetime` | `@index(hour)` |
| `Boolean` | `int` | `@index(int)` |

See [Schema & Predicates](../schema.md) for full details.

---

## Logging

The provider logs connection events through the Fable logging system:

| Event | Level | Message |
|-------|-------|---------|
| Connecting | `info` | `Meadow-Connection-DGraph connecting to [url]` |
| Already connected | `error` | `...trying to connect but is already connected - skipping.` |
| Missing library | `error` | `...dgraph-js-http is not installed.` |
| Missing callback | `error` | `...connectAsync() called without a callback.` |
| Schema applied | `info` | `...schema for [TypeName] applied successfully.` |
| Schema failed | `error` | `...CREATE SCHEMA for [TypeName] failed!` |
| Not connected | `error` | `...CREATE SCHEMA for [TypeName] failed: not connected.` |

---

## Related

- [Quickstart Guide](../quickstart.md) -- Get running in five steps
- [Architecture & Design](../architecture.md) -- Lifecycle and data flow diagrams
- [Schema & Predicates](../schema.md) -- Predicate type mapping and index strategies
