# Meadow Connection Dgraph

A Dgraph database connection provider for the Meadow ORM. Wraps [dgraph-js-http](https://github.com/dgraph-io/dgraph-js-http) as a Fable service, providing HTTP client management with optional auth token support and schema generation from Meadow table schemas.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

- **Dgraph HTTP Client** -- Managed connection to Dgraph Alpha via [dgraph-js-http](https://github.com/dgraph-io/dgraph-js-http)
- **Fable Service Provider** -- Registers with a Fable instance for dependency injection, logging, and configuration
- **Schema-Driven DDL** -- Generates Dgraph predicate declarations and type definitions from Meadow table schemas with automatic index directives
- **Auth Token Support** -- Optional Alpha auth token for secured Dgraph clusters
- **Connection Safety** -- Guards against double-connect with descriptive logging
- **Direct Client Access** -- Exposes the underlying Dgraph client and stub via `pool` and `stub` getters
- **Graph-Native Types** -- Maps Meadow types to Dgraph scalar types with appropriate index strategies (exact, term, fulltext, int, float, hour)

## Installation

```bash
npm install meadow-connection-dgraph
```

## Quick Start

```javascript
const libFable = require('fable');
const MeadowConnectionDGraph = require('meadow-connection-dgraph');

let fable = new libFable(
{
	DGraph:
	{
		Server: 'localhost',
		Port: 8080
	}
});

fable.serviceManager.addServiceType('MeadowDGraphProvider', MeadowConnectionDGraph);
fable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');

fable.MeadowDGraphProvider.connectAsync(
	(pError, pClient) =>
	{
		if (pError)
		{
			console.error('Connection failed:', pError);
			return;
		}

		// Use the Dgraph client for transactions
		let tmpTxn = pClient.newTxn();
		tmpTxn.query('{ animals(func: type(Animal)) { uid Name Age } }')
			.then((pResult) =>
			{
				console.log(pResult.data);
			});
	});
```

## Configuration

Dgraph settings are provided through the Fable settings `DGraph` object or constructor options:

```javascript
let fable = new libFable(
{
	DGraph:
	{
		Server: 'localhost',
		Port: 8080,
		AuthToken: ''
	}
});
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Server` / `host` | `String` | `'localhost'` | Dgraph Alpha hostname or IP |
| `Port` / `port` | `Number` | `8080` | Dgraph Alpha HTTP port |
| `AuthToken` / `authToken` | `String` | `''` | Optional Alpha auth token |
| `MeadowConnectionDGraphAutoConnect` | `Boolean` | `false` | Auto-connect on instantiation |

## API

### `connectAsync(fCallback)`

Open the Dgraph HTTP client connection. This is the recommended connection method.

| Parameter | Type | Description |
|-----------|------|-------------|
| `fCallback` | `Function` | Callback receiving `(error, client)` |

### `connect()`

Synchronous connection method. Creates the client stub and client instance.

### `pool` (getter)

Returns the underlying `DgraphClient` instance for direct query and mutation access.

### `stub` (getter)

Returns the raw `DgraphClientStub` for low-level HTTP operations.

### `connected` (property)

Boolean indicating whether the Dgraph client has been established.

### `generateCreateTableStatement(pMeadowTableSchema)`

Generate Dgraph predicate declarations and a type definition from a Meadow table schema.

### `createTable(pMeadowTableSchema, fCallback)`

Generate and apply a schema to the connected Dgraph instance via `client.alter()`.

### `createTables(pMeadowSchema, fCallback)`

Create all schemas defined in a Meadow schema object (iterates `pMeadowSchema.Tables` sequentially).

### `generateDropTableStatement(pTableName)`

Generate a drop type descriptor for the given type name.

## Predicate Type Mapping

| Meadow Type | Dgraph Type | Index Directive |
|-------------|-------------|-----------------|
| `ID` | `int` | `@index(int)` |
| `GUID` | `string` | `@index(exact)` |
| `ForeignKey` | `int` | `@index(int)` |
| `Numeric` | `int` | `@index(int)` |
| `Decimal` | `float` | `@index(float)` |
| `String` | `string` | `@index(exact, term)` |
| `Text` | `string` | `@index(fulltext)` |
| `DateTime` | `datetime` | `@index(hour)` |
| `Boolean` | `int` | `@index(int)` |

## Part of the Retold Framework

Meadow Connection Dgraph is a database connector for the Meadow data access layer:

- [meadow](https://github.com/stevenvelozo/meadow) -- ORM and data access framework
- [foxhound](https://github.com/stevenvelozo/foxhound) -- Query DSL used by Meadow
- [stricture](https://github.com/stevenvelozo/stricture) -- Schema definition tool
- [meadow-endpoints](https://github.com/stevenvelozo/meadow-endpoints) -- RESTful endpoint generation
- [fable](https://github.com/stevenvelozo/fable) -- Application services framework

## Testing

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm run coverage
```

## Related Packages

- [meadow](https://github.com/stevenvelozo/meadow) -- Data access and ORM
- [meadow-connection-mysql](https://github.com/stevenvelozo/meadow-connection-mysql) -- MySQL connection provider
- [meadow-connection-mssql](https://github.com/stevenvelozo/meadow-connection-mssql) -- MSSQL connection provider
- [meadow-connection-sqlite](https://github.com/stevenvelozo/meadow-connection-sqlite) -- SQLite connection provider
- [fable](https://github.com/stevenvelozo/fable) -- Application services framework

## License

MIT

## Contributing

Pull requests are welcome. For details on our code of conduct, contribution process, and testing requirements, see the [Retold Contributing Guide](https://github.com/stevenvelozo/retold/blob/main/docs/contributing.md).
