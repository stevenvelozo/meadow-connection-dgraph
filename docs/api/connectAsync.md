# connectAsync(fCallback)

Establishes a connection to Dgraph Alpha via HTTP and returns the client through a callback. This is the recommended connection method.

## Signature

```javascript
connectAsync(fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fCallback` | `function` | Callback receiving `(error, client)` |

## Return Value

Returns the result of the callback invocation.

## Callback Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pError` | `Error \| null` | Error object if connection failed, `null` on success |
| `pClient` | `DgraphClient` | The dgraph-js-http client instance |

## Behavior

1. If `fCallback` is not a function, logs an error and substitutes a no-op callback
2. If already connected (`this._Client` exists), returns immediately with the existing client
3. Otherwise calls `connect()` internally to create the client stub and client
4. Wraps in try-catch for error handling
5. Calls back with `(null, client)` on success or `(error)` on failure

## Basic Usage

```javascript
_Fable.MeadowDGraphProvider.connectAsync(
	(pError, pClient) =>
	{
		if (pError)
		{
			console.error('Connection failed:', pError);
			return;
		}

		// pClient is the DgraphClient instance
		let tmpTxn = pClient.newTxn({ readOnly: true });
		tmpTxn.query('{ animals(func: type(Animal)) { uid Name } }')
			.then((pResponse) =>
			{
				console.log(pResponse.data);
			});
	});
```

## Double-Connect Guard

Calling `connectAsync()` on an already-connected provider returns the existing client:

```javascript
_Fable.MeadowDGraphProvider.connectAsync(
	(pError, pClient1) =>
	{
		// First connection — succeeds normally

		_Fable.MeadowDGraphProvider.connectAsync(
			(pError, pClient2) =>
			{
				// Returns the same client instance
				// pClient1 === pClient2
			});
	});
```

## Missing Callback

If called without a callback, logs an error and uses a no-op:

```javascript
_Fable.MeadowDGraphProvider.connectAsync();
// Logs: "Meadow DGraph connectAsync() called without a callback."
```

## Error Handling

Connection errors (e.g. `dgraph-js-http` not installed) are caught and passed to the callback:

```javascript
_Fable.MeadowDGraphProvider.connectAsync(
	(pError) =>
	{
		if (pError)
		{
			// Handle connection error
			console.error(pError);
		}
	});
```

## Related

- [connect](connect.md) -- Synchronous connection method
- [pool](pool.md) -- Access the Dgraph client after connecting
- [stub](stub.md) -- Access the raw HTTP client stub
