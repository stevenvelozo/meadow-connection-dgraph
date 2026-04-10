# createTable(pMeadowTableSchema, fCallback)

Generates Dgraph predicate declarations and a type definition from a Meadow table schema and applies it to the connected Dgraph instance via `client.alter()`.

## Signature

```javascript
createTable(pMeadowTableSchema, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMeadowTableSchema` | `object` | Meadow table schema with `TableName` and `Columns` array |
| `fCallback` | `function` | Callback receiving `(error)` |

## Return Value

Returns the result of the callback invocation.

## Behavior

1. Calls `generateCreateTableStatement(pMeadowTableSchema)` to build the schema descriptor
2. Validates that the client is connected (`this._Client`)
3. Calls `this._Client.alter({ schema: descriptor.schema })` (Promise-based)
4. On success: logs info, calls `fCallback()` with no error
5. On error: logs the error, calls `fCallback(pError)`

## Basic Usage

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
		{ Column: 'Weight', DataType: 'Decimal' }
	]
};

_Fable.MeadowDGraphProvider.createTable(tmpAnimalSchema,
	(pError) =>
	{
		if (pError)
		{
			console.error('Schema failed:', pError);
			return;
		}
		console.log('Animal schema applied!');
	});
```

## Additive Schema

Dgraph schema alterations are additive. Calling `createTable()` multiple times with the same schema is safe -- predicates and types are updated, not duplicated. This makes `createTable()` safe to call during application startup.

## Not Connected

If the client is not connected, the callback receives an error immediately:

```javascript
// Before connecting
_Fable.MeadowDGraphProvider.createTable(tmpSchema,
	(pError) =>
	{
		// pError: "Not connected to DGraph"
	});
```

## Prerequisites

The connection must be established before calling `createTable()`:

```javascript
_Fable.MeadowDGraphProvider.connectAsync(
	(pError) =>
	{
		if (pError) { return; }

		_Fable.MeadowDGraphProvider.createTable(tmpAnimalSchema,
			(pCreateError) =>
			{
				if (pCreateError) { console.error(pCreateError); }
			});
	});
```

## Related

- [generateCreateTableStatement](generateCreateTableStatement.md) -- Generate schema without applying
- [createTables](createTables.md) -- Apply multiple schemas sequentially
- [generateDropTableStatement](generateDropTableStatement.md) -- Generate drop descriptor
- [Schema & Predicates](../schema.md) -- Full type mapping reference
