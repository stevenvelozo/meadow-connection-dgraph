# Architecture & Design

Meadow Connection Dgraph connects Fable applications to Dgraph graph databases through the service provider pattern. This page illustrates the system architecture, connection lifecycle, query model, and how the provider fits into the Meadow ecosystem.

---

## System Architecture

```mermaid
graph TB
	App["Fable Application"]
	Settings["fable.settings.DGraph"]
	Provider["MeadowConnectionDGraph<br/>(Fable Service Provider)"]
	DgraphHTTP["dgraph-js-http<br/>(HTTP Client)"]
	Alpha["Dgraph Alpha<br/>(HTTP API)"]

	App -->|"reads config"| Settings
	App -->|"connectAsync()"| Provider
	Provider -->|"new DgraphClientStub(url)"| DgraphHTTP
	DgraphHTTP -->|"HTTP requests"| Alpha
	Provider -->|".pool getter"| DgraphHTTP
	Settings -->|"Server, Port, AuthToken"| Provider
```

---

## Connection Lifecycle

```mermaid
sequenceDiagram
	participant App as Application
	participant SM as ServiceManager
	participant Provider as MeadowConnectionDGraph
	participant Stub as DgraphClientStub
	participant Client as DgraphClient
	participant Alpha as Dgraph Alpha

	App->>SM: addServiceType('MeadowDGraphProvider', lib)
	App->>SM: instantiateServiceProvider('MeadowDGraphProvider')
	SM->>Provider: new MeadowConnectionDGraph(fable, manifest, hash)
	Note over Provider: connected = false

	App->>Provider: connectAsync(callback)

	alt Already connected
		Provider-->>App: callback(null, existingClient)
	else dgraph-js-http not installed
		Provider-->>App: Error logged, returns
	else Normal connect
		Provider->>Provider: _buildConnectionURL()
		Note over Provider: http://host:port
		Provider->>Stub: new DgraphClientStub(url)
		Provider->>Client: new DgraphClient(stub)
		opt AuthToken provided
			Provider->>Client: setAlphaAuthToken(token)
		end
		Note over Provider: connected = true
		Provider-->>App: callback(null, client)
	end
```

---

## Query and Mutation Model

Unlike SQL-based Meadow connectors, Dgraph uses a transaction-based model. The provider exposes the client; all operations happen through transactions:

```mermaid
flowchart LR
	subgraph "Dgraph Transaction API"
		QUERY["txn.query(dql)<br/>→ DQL response"]
		QVAR["txn.queryWithVars(dql, vars)<br/>→ DQL response"]
		MUTATE["txn.mutate(mutation)<br/>→ mutation response"]
		COMMIT["txn.commit()<br/>→ finalize"]
		DISCARD["txn.discard()<br/>→ rollback"]
	end

	subgraph "Client Operations"
		NEWTXN["client.newTxn()"]
		ALTER["client.alter(schema)<br/>→ schema change"]
	end

	NEWTXN --> QUERY
	NEWTXN --> QVAR
	NEWTXN --> MUTATE
	MUTATE --> COMMIT
	MUTATE --> DISCARD

	style QUERY fill:#e8f4e8
	style MUTATE fill:#e8f0f8
	style ALTER fill:#f8f0e8
```

### Operation Types

| Operation | Method | Description |
|-----------|--------|-------------|
| DQL Query | `txn.query(dql)` | Read data using DQL |
| Query with Variables | `txn.queryWithVars(dql, vars)` | Parameterized queries |
| Mutation | `txn.mutate({ setJson })` | Insert or update nodes |
| Delete | `txn.mutate({ deleteJson })` | Remove nodes or edges |
| Commit | `txn.commit()` | Finalize the transaction |
| Discard | `txn.discard()` | Abort the transaction |
| Schema Alter | `client.alter({ schema })` | Apply predicate and type definitions |
| Drop All | `client.alter({ dropAll: true })` | Drop all data and schema |

---

## Connection Settings Flow

```mermaid
flowchart TD
	FS["fable.settings.DGraph<br/>(Server, Port, AuthToken)"]
	CO["Constructor Options<br/>(host, port, authToken)"]
	Provider["MeadowConnectionDGraph"]
	Decision{{"Which source?"}}
	Normalize["Normalize property names<br/>(Server→host, Port→port, AuthToken→authToken)"]
	URL["_buildConnectionURL()<br/>http://host:port"]

	FS --> Decision
	CO --> Decision
	Decision -->|"Options override Settings"| Normalize
	Normalize --> URL
	URL --> Provider
```

Settings priority:

1. **Constructor options** — passed as the second argument to `instantiateServiceProvider()`
2. **Fable settings** — `fable.settings.DGraph`

Both Meadow-style (`Server`, `Port`, `AuthToken`) and lowercase (`host`, `port`, `authToken`) property names are supported. Meadow-style names are normalized to lowercase during construction.

---

## Schema Generation Flow

The `generateCreateTableStatement()` method translates a Meadow table schema into Dgraph predicate declarations and a type definition:

```mermaid
flowchart LR
	Schema["Meadow Table Schema<br/>{ TableName, Columns[] }"]
	Gen["generateCreateTableStatement()"]
	Desc["Descriptor Object<br/>{ operation, schema, typeName }"]
	Alter["client.alter({ schema })"]
	Dgraph["Dgraph Schema Applied"]

	Schema --> Gen
	Gen --> Desc
	Desc --> Alter
	Alter --> Dgraph

	style Schema fill:#f0f0f0
	style Desc fill:#e8f4e8
	style Dgraph fill:#e8f0f8
```

Each Meadow column becomes a Dgraph predicate with an appropriate type and index:

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

See [Schema & Predicates](schema.md) for full details.

---

## Connection Safety

```mermaid
flowchart TD
	Start["connectAsync() called"]
	CheckCB{{"Callback<br/>provided?"}}
	CheckConn{{"Already<br/>connected?"}}
	CheckLib{{"dgraph-js-http<br/>loaded?"}}
	Connect["Create ClientStub + Client"]
	Auth{{"AuthToken<br/>provided?"}}
	SetAuth["setAlphaAuthToken()"]
	Done["callback(null, client)"]
	ErrCB["Log error, use no-op callback"]
	ErrConn["Log error, return existing client"]
	ErrLib["Log error, return"]

	Start --> CheckCB
	CheckCB -->|No| ErrCB
	CheckCB -->|Yes| CheckConn
	ErrCB --> CheckConn
	CheckConn -->|Yes| ErrConn
	CheckConn -->|No| CheckLib
	CheckLib -->|No| ErrLib
	CheckLib -->|Yes| Connect
	Connect --> Auth
	Auth -->|Yes| SetAuth
	Auth -->|No| Done
	SetAuth --> Done

	style ErrCB fill:#f8f0e0
	style ErrConn fill:#f8f0e0
	style ErrLib fill:#f8e0e0
	style Done fill:#e0f8e0
```

The provider guards against:

- **Missing callback** -- Logs an error and substitutes a no-op callback
- **Double connect** -- Logs an error and returns the existing client
- **Missing library** -- Logs an error if `dgraph-js-http` is not installed

---

## Dgraph vs SQL Architecture

Unlike SQL-based Meadow connectors, Dgraph is a graph database with a fundamentally different data model:

| Concept | SQL Connectors | Dgraph Connector |
|---------|----------------|-------------------|
| **Data model** | Tables with rows and columns | Nodes with predicates and edges |
| **Query language** | SQL | DQL (Dgraph Query Language) |
| **Schema** | CREATE TABLE with columns | Predicate declarations + type definitions |
| **Primary key** | Auto-increment integer | UID (assigned by Dgraph) |
| **Relationships** | Foreign keys + JOINs | Edges between nodes |
| **Transactions** | Connection pool based | Client transaction objects |
| **Connection** | TCP pool | HTTP client stub |
| **Index types** | B-tree, hash | int, float, exact, term, fulltext, hour |

---

## Connector Comparison

| Feature | Dgraph | MySQL | MSSQL | SQLite | RocksDB |
|---------|--------|-------|-------|--------|---------|
| **Database Type** | Graph | Relational | Relational | Relational | Key-Value |
| **Server Required** | Yes | Yes | Yes | No | No |
| **Protocol** | HTTP | TCP | TDS | File I/O | File I/O |
| **Query API** | Transaction-based | Callback | Promise | Synchronous | Callback |
| **Query Language** | DQL | SQL | T-SQL | SQL | Key-Value |
| **Schema Format** | Predicates + Types | CREATE TABLE | CREATE TABLE | CREATE TABLE | None |
| **Auto-increment** | UID (Dgraph) | AUTO_INCREMENT | IDENTITY | AUTOINCREMENT | N/A |
| **Index Control** | Per-predicate | Per-column | Per-column | Per-column | Built-in |
| **Auth Support** | Alpha auth token | User/password | User/password | None | None |
| **Native Driver** | dgraph-js-http | mysql2 | mssql (Tedious) | better-sqlite3 | @nxtedition/rocksdb |
| **Best For** | Graph traversals | Production OLTP | Enterprise | Local/embedded | High-throughput KV |
