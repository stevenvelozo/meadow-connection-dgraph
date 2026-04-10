# connect()

Synchronous method that creates the Dgraph HTTP client stub and client instance.

## Signature

```javascript
connect()
```

## Parameters

None.

## Return Value

None.

## Behavior

1. If already connected (`this._Client` exists), logs an error and returns without action
2. If `dgraph-js-http` is not installed, logs an error and returns
3. Builds the connection URL via `_buildConnectionURL()` (e.g. `http://localhost:8080`)
4. Creates a new `DgraphClientStub` at the URL
5. Creates a new `DgraphClient` wrapping the stub
6. If `authToken` is provided, calls `client.setAlphaAuthToken(token)`
7. Sets `this.connected = true`

## Usage

```javascript
_Fable.MeadowDGraphProvider.connect();

if (_Fable.MeadowDGraphProvider.connected)
{
	let tmpClient = _Fable.MeadowDGraphProvider.pool;
	// Use the client
}
```

## Why Both connect() and connectAsync()?

Unlike the MSSQL connector where connections are inherently asynchronous, Dgraph's HTTP client stub creation is synchronous. The `connect()` method works reliably for immediate use. However, `connectAsync()` is preferred because:

- It follows the Fable service provider convention
- It provides error handling via the callback
- It guards against missing callbacks
- It is consistent with other Meadow connector APIs

## Auto-Connect

The `connect()` method is called automatically during construction if `MeadowConnectionDGraphAutoConnect` is `true`:

```javascript
let _Fable = new libFable(
	{
		"DGraph":
		{
			"Server": "localhost",
			"Port": 8080
		},
		"MeadowConnectionDGraphAutoConnect": true
	});

_Fable.serviceManager.addAndInstantiateServiceType(
	'MeadowDGraphProvider', libMeadowConnectionDGraph);

// Already connected -- pool is ready
let tmpClient = _Fable.MeadowDGraphProvider.pool;
```

## Related

- [connectAsync](connectAsync.md) -- Callback-style connection (recommended)
- [pool](pool.md) -- Access the client after connecting
- [stub](stub.md) -- Access the raw client stub
