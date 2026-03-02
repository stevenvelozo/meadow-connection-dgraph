# Quickstart

Get a Dgraph connection established and schemas applied in five steps.

---

## Prerequisites

- Node.js 14 or later
- A running Dgraph Alpha instance accessible over HTTP (default: `localhost:8080`)
- Dgraph Zero orchestrating the cluster

---

## Step 1 — Install

```bash
npm install meadow-connection-dgraph fable
```

---

## Step 2 — Configure and Connect

```javascript
const libFable = require('fable');
const libMeadowConnectionDGraph = require('meadow-connection-dgraph');

let _Fable = new libFable(
	{
		"Product": "AnimalTracker",
		"ProductVersion": "1.0.0",
		"DGraph":
		{
			"Server": "localhost",
			"Port": 8080
		}
	});

_Fable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
_Fable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');

_Fable.MeadowDGraphProvider.connectAsync(
	(pError, pClient) =>
	{
		if (pError)
		{
			console.error('Connection failed:', pError);
			return;
		}

		console.log('Connected:', _Fable.MeadowDGraphProvider.connected);
		// => Connected: true
	});
```

The provider creates a `DgraphClientStub` at `http://localhost:8080` and wraps it in a `DgraphClient`.

For secured clusters, add an `AuthToken`:

```javascript
"DGraph":
{
	"Server": "dgraph.example.com",
	"Port": 8080,
	"AuthToken": "your-alpha-auth-token"
}
```

---

## Step 3 — Run Queries and Mutations

All queries and mutations go through the Dgraph client via the `pool` getter:

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;

// --- Query ---
let tmpQueryTxn = tmpClient.newTxn({ readOnly: true });
tmpQueryTxn.query('{ animals(func: type(Animal)) { uid Name Age Weight } }')
	.then((pResponse) =>
	{
		console.log('Animals:', pResponse.data);
	});

// --- Mutation ---
let tmpMutTxn = tmpClient.newTxn();
let tmpMutation = {
	setJson: {
		'dgraph.type': 'Animal',
		Name: 'Luna',
		Age: 3,
		Weight: 4.5
	}
};

tmpMutTxn.mutate(tmpMutation)
	.then(() =>
	{
		return tmpMutTxn.commit();
	})
	.then(() =>
	{
		console.log('Animal created!');
	})
	.catch((pError) =>
	{
		console.error('Mutation failed:', pError);
	});
```

### Key Client Methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `client.newTxn()` | `Txn` | Create a new transaction |
| `client.newTxn({ readOnly: true })` | `Txn` | Create a read-only transaction |
| `txn.query(dql)` | `Promise<Response>` | Execute a DQL query |
| `txn.queryWithVars(dql, vars)` | `Promise<Response>` | Query with variable bindings |
| `txn.mutate(mutation)` | `Promise<Response>` | Execute a mutation |
| `txn.commit()` | `Promise` | Commit the transaction |
| `txn.discard()` | `Promise` | Discard the transaction |
| `client.alter(operation)` | `Promise` | Alter schema or drop data |

---

## Step 4 — Create Schemas from Meadow Table Definitions

Instead of writing Dgraph schema by hand, pass a Meadow table schema to `createTable()`:

```javascript
let tmpAnimalSchema =
{
	TableName: 'Animal',
	Columns:
	[
		{ Column: 'IDAnimal', DataType: 'ID' },
		{ Column: 'GUIDAnimal', DataType: 'GUID' },
		{ Column: 'Name', DataType: 'String' },
		{ Column: 'Age', DataType: 'Numeric' },
		{ Column: 'Weight', DataType: 'Decimal' },
		{ Column: 'Description', DataType: 'Text' },
		{ Column: 'CreateDate', DataType: 'DateTime' },
		{ Column: 'Deleted', DataType: 'Boolean' },
		{ Column: 'IDFarm', DataType: 'ForeignKey' }
	]
};

_Fable.MeadowDGraphProvider.createTable(tmpAnimalSchema,
	(pError) =>
	{
		if (pError) { console.error('Schema failed:', pError); return; }
		console.log('Animal schema applied!');
	});
```

You can also preview the schema without applying it:

```javascript
let tmpDescriptor = _Fable.MeadowDGraphProvider.generateCreateTableStatement(tmpAnimalSchema);
console.log(tmpDescriptor.schema);
```

Output:

```
IDAnimal: int @index(int) .
GUIDAnimal: string @index(exact) .
Name: string @index(exact, term) .
Age: int @index(int) .
Weight: float @index(float) .
Description: string @index(fulltext) .
CreateDate: datetime @index(hour) .
Deleted: int @index(int) .
IDFarm: int @index(int) .
type Animal {
	IDAnimal
	GUIDAnimal
	Name
	Age
	Weight
	Description
	CreateDate
	Deleted
	IDFarm
}
```

---

## Step 5 — Create Multiple Schemas

For applications with many entity types, use `createTables()` with a full Meadow schema:

```javascript
let tmpFullSchema =
{
	Tables:
	[
		{
			TableName: 'Farm',
			Columns:
			[
				{ Column: 'IDFarm', DataType: 'ID' },
				{ Column: 'GUIDFarm', DataType: 'GUID' },
				{ Column: 'Name', DataType: 'String' }
			]
		},
		{
			TableName: 'Animal',
			Columns:
			[
				{ Column: 'IDAnimal', DataType: 'ID' },
				{ Column: 'Name', DataType: 'String' },
				{ Column: 'IDFarm', DataType: 'ForeignKey' }
			]
		}
	]
};

_Fable.MeadowDGraphProvider.createTables(tmpFullSchema,
	(pError) =>
	{
		if (pError) { return; }
		console.log('All schemas applied');
	});
```

Schemas are applied sequentially (one at a time) via `client.alter()`.

---

## Summary

| Step | What It Does |
|------|-------------|
| Install | `npm install meadow-connection-dgraph fable` |
| Configure | Set `DGraph.Server` and `DGraph.Port` in Fable settings |
| Connect | `connectAsync()` creates the HTTP client stub and client |
| Query | `pool.newTxn().query(dql)` for DQL queries and mutations |
| Schema | `createTable()` generates and applies Dgraph predicates and types |

---

## Next Steps

- [Architecture & Design](architecture.md) -- Connection lifecycle and data flow diagrams
- [Schema & Predicates](schema.md) -- Predicate type mapping and index strategies
- [API Reference](api/reference.md) -- Complete reference for every property and method
