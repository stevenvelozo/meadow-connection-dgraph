# createTables(pMeadowSchema, fCallback)

Applies all schemas defined in a Meadow schema object by calling `createTable()` for each table sequentially.

## Signature

```javascript
createTables(pMeadowSchema, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMeadowSchema` | `object` | Meadow schema with a `Tables` array of table schema objects |
| `fCallback` | `function` | Callback receiving `(error)` |

## Return Value

Returns the result of the callback invocation.

## Schema Object Format

```javascript
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
				{ Column: 'GUIDAnimal', DataType: 'GUID' },
				{ Column: 'Name', DataType: 'String' },
				{ Column: 'IDFarm', DataType: 'ForeignKey' }
			]
		}
	]
}
```

## Basic Usage

```javascript
_Fable.MeadowDGraphProvider.createTables(tmpFullSchema,
	(pError) =>
	{
		if (pError)
		{
			console.error('Schema creation failed:', pError);
			return;
		}
		console.log('All schemas applied');
	});
```

## Behavior

- Iterates `pMeadowSchema.Tables` using `fable.Utility.eachLimit()` with concurrency 1
- Each table is processed by calling `createTable()` internally
- If any schema application fails, the error is logged and passed to the callback
- On completion, logs "Done creating DGraph schemas!"

## Sequential Execution

Schemas are applied one at a time (concurrency = 1). This avoids race conditions with concurrent `client.alter()` calls against the same Dgraph cluster.

## Error Handling

If a schema application fails, the error is passed to the callback. Schemas applied before the failure remain in Dgraph:

```javascript
_Fable.MeadowDGraphProvider.createTables(tmpFullSchema,
	(pError) =>
	{
		if (pError)
		{
			// Farm schema may have been applied, but Animal failed
			console.error('Schema error:', pError);
		}
	});
```

## Related

- [createTable](createTable.md) -- Apply a single schema
- [generateCreateTableStatement](generateCreateTableStatement.md) -- Generate schema without applying
- [Schema & Predicates](../schema.md) -- Full type mapping reference
