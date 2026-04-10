# generateDropTableStatement(pTableName)

Generates a drop type descriptor for the given Dgraph type name. Returns a descriptor object without executing any operations.

## Signature

```javascript
generateDropTableStatement(pTableName)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pTableName` | `string` | The name of the Dgraph type to drop |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `operation` | `string` | Always `'dropType'` |
| `type` | `string` | The type name to drop |

## Basic Usage

```javascript
let tmpDescriptor = _Fable.MeadowDGraphProvider.generateDropTableStatement('Animal');
console.log(tmpDescriptor);
// => { operation: 'dropType', type: 'Animal' }
```

## Executing the Drop

This method only generates a descriptor -- it does not execute against Dgraph. To drop a type, use the client's alter API:

```javascript
let tmpDescriptor = _Fable.MeadowDGraphProvider.generateDropTableStatement('Animal');

// Drop the type via the Dgraph client
_Fable.MeadowDGraphProvider.pool.alter({ dropAttr: tmpDescriptor.type })
	.then(() => { console.log('Type dropped'); })
	.catch((pError) => { console.error(pError); });
```

## Dgraph Drop vs SQL DROP TABLE

Unlike SQL `DROP TABLE` which removes the table and all data, Dgraph's drop operations are more granular:

| Operation | Dgraph API | Effect |
|-----------|------------|--------|
| Drop a predicate | `client.alter({ dropAttr: 'Name' })` | Removes a single predicate and its data |
| Drop all data | `client.alter({ dropAll: true })` | Removes all data and schema |
| Drop data only | `client.alter({ dropOp: 'DATA' })` | Removes data, keeps schema |

The descriptor returned by this method provides the type name for use with your preferred drop strategy.

## Comparison with SQL Connectors

| Connector | Drop Output |
|-----------|-------------|
| MySQL | `DROP TABLE IF EXISTS \`Animal\`;` |
| MSSQL | `IF OBJECT_ID('dbo.[Animal]', 'U') IS NOT NULL DROP TABLE dbo.[Animal]; GO` |
| SQLite | `DROP TABLE IF EXISTS Animal;` |
| Dgraph | `{ operation: 'dropType', type: 'Animal' }` |

## Related

- [generateCreateTableStatement](generateCreateTableStatement.md) -- Generate schema descriptor
- [createTable](createTable.md) -- Generate and apply schema
- [pool](pool.md) -- Access the client to execute drop operations
