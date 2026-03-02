# pool (getter)

Returns the underlying `DgraphClient` instance for direct query and mutation access.

## Signature

```javascript
get pool()
```

## Return Value

| Type | Description |
|------|-------------|
| `DgraphClient` | The dgraph-js-http client instance (after connecting) |
| `false` | Before connection |

## Primary Use

The `pool` getter is the main entry point for all Dgraph operations. The name `pool` provides API symmetry with SQL-based Meadow connectors (which return connection pools), even though Dgraph uses a single HTTP client rather than a connection pool.

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;
```

## Query Example

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;

// Create a read-only transaction
let tmpTxn = tmpClient.newTxn({ readOnly: true });

// DQL query
tmpTxn.query('{ animals(func: type(Animal)) { uid Name Age Weight } }')
	.then((pResponse) =>
	{
		console.log(pResponse.data);
		// => { animals: [{ uid: '0x1', Name: 'Luna', Age: 3, Weight: 4.5 }, ...] }
	});
```

## Query with Variables

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;
let tmpTxn = tmpClient.newTxn({ readOnly: true });

let tmpDQL = `query animals($minAge: int) {
	animals(func: type(Animal)) @filter(ge(Age, $minAge)) {
		uid
		Name
		Age
	}
}`;

tmpTxn.queryWithVars(tmpDQL, { $minAge: '2' })
	.then((pResponse) =>
	{
		console.log(pResponse.data);
	});
```

## Mutation Example

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;
let tmpTxn = tmpClient.newTxn();

tmpTxn.mutate({
	setJson: {
		'dgraph.type': 'Animal',
		Name: 'Luna',
		Age: 3,
		Weight: 4.5
	}
})
.then(() =>
{
	return tmpTxn.commit();
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

## Schema Alter Example

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;

tmpClient.alter({
	schema: 'Name: string @index(exact, term) .\ntype Animal {\n\tName\n}'
})
.then(() =>
{
	console.log('Schema applied!');
});
```

## Client Methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `client.newTxn()` | `Txn` | Create a new read-write transaction |
| `client.newTxn({ readOnly: true })` | `Txn` | Create a read-only transaction |
| `client.alter(operation)` | `Promise` | Alter schema or drop data |
| `client.setAlphaAuthToken(token)` | void | Set auth token for ACL |

## Transaction Methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `txn.query(dql)` | `Promise<Response>` | Execute a DQL query |
| `txn.queryWithVars(dql, vars)` | `Promise<Response>` | Parameterized DQL query |
| `txn.mutate(mutation)` | `Promise<Response>` | Insert, update, or delete data |
| `txn.commit()` | `Promise` | Commit the transaction |
| `txn.discard()` | `Promise` | Discard the transaction |

## Before Connection

Returns `false` before `connect()` or `connectAsync()` is called:

```javascript
let tmpClient = _Fable.MeadowDGraphProvider.pool;
// tmpClient => false (not connected yet)
```

Always check `connected` before using `pool`:

```javascript
if (!_Fable.MeadowDGraphProvider.connected)
{
	console.error('Not connected to Dgraph.');
	return;
}

let tmpClient = _Fable.MeadowDGraphProvider.pool;
```

## Related

- [connectAsync](connectAsync.md) -- Establish the connection
- [stub](stub.md) -- Access the raw HTTP client stub
