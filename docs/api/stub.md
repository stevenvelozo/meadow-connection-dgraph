# stub (getter)

Returns the raw `DgraphClientStub` instance for low-level HTTP operations.

## Signature

```javascript
get stub()
```

## Return Value

| Type | Description |
|------|-------------|
| `DgraphClientStub` | The dgraph-js-http client stub (after connecting) |
| `false` | Before connection |

## Primary Use

The `stub` getter exposes the underlying HTTP transport layer. In most cases you should use the `pool` getter (which returns the `DgraphClient`) instead. The stub is useful for:

- Accessing low-level HTTP configuration
- Creating additional client instances from the same stub
- Diagnostic or debugging purposes

```javascript
let tmpStub = _Fable.MeadowDGraphProvider.stub;
```

## Comparison with pool

| Getter | Returns | Purpose |
|--------|---------|---------|
| `pool` | `DgraphClient` | High-level client for queries, mutations, schema |
| `stub` | `DgraphClientStub` | Low-level HTTP transport stub |

The `pool` getter returns the `DgraphClient`, which wraps the stub and provides the transaction API (`newTxn()`, `alter()`, etc.). The `stub` getter returns the raw `DgraphClientStub` that handles HTTP communication with Dgraph Alpha.

## Before Connection

Returns `false` before connection:

```javascript
let tmpStub = _Fable.MeadowDGraphProvider.stub;
// tmpStub => false (not connected yet)
```

## Related

- [pool](pool.md) -- The high-level Dgraph client (recommended for most use)
- [connectAsync](connectAsync.md) -- Establish the connection
