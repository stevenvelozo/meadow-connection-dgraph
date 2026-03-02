# Schema & Predicates

Meadow Connection Dgraph generates Dgraph predicate declarations and type definitions from Meadow table schemas. This page documents the type mapping, index strategies, and schema generation process.

---

## Dgraph Schema Model

Unlike SQL databases which use `CREATE TABLE` statements, Dgraph schemas consist of two parts:

1. **Predicate declarations** -- Define the name, scalar type, and index for each data field
2. **Type definitions** -- Group predicates into named types for query filtering

```
Name: string @index(exact, term) .
Age: int @index(int) .

type Animal {
	Name
	Age
}
```

---

## Predicate Type Mapping

| Meadow DataType | Dgraph Type | Index Directive | Notes |
|-----------------|-------------|-----------------|-------|
| `ID` | `int` | `@index(int)` | Numeric application-level ID (Dgraph also assigns a `uid`) |
| `GUID` | `string` | `@index(exact)` | Exact match on UUID strings |
| `ForeignKey` | `int` | `@index(int)` | Integer reference to another entity |
| `Numeric` | `int` | `@index(int)` | 64-bit signed integer |
| `Decimal` | `float` | `@index(float)` | 64-bit IEEE floating point |
| `String` | `string` | `@index(exact, term)` | Exact match and term-based search |
| `Text` | `string` | `@index(fulltext)` | Full-text search with stemming |
| `DateTime` | `datetime` | `@index(hour)` | Hour-level granularity for range queries |
| `Boolean` | `int` | `@index(int)` | 0 = false, 1 = true |
| Default | `string` | (none) | Unknown types default to unindexed string |

### Index Strategies

Dgraph supports several index types. The provider selects the most appropriate index for each Meadow data type:

| Index | Applied To | Purpose |
|-------|-----------|---------|
| `@index(int)` | ID, ForeignKey, Numeric, Boolean | Integer equality and range filters |
| `@index(float)` | Decimal | Floating-point range filters |
| `@index(exact)` | GUID | Exact string equality matching |
| `@index(exact, term)` | String | Exact match + individual term search |
| `@index(fulltext)` | Text | Full-text search with language-aware stemming |
| `@index(hour)` | DateTime | Date range queries at hour granularity |

---

## Schema Object Format

A Meadow table schema is a plain JavaScript object:

```javascript
let tmpSchema =
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
```

Each entry in the `Columns` array requires:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `Column` | string | Yes | Predicate name |
| `DataType` | string | Yes | Meadow data type (see mapping above) |
| `Size` | string | No | Ignored by Dgraph (no size constraints) |

---

## Generating Schema

### generateCreateTableStatement()

Pass a schema object to get a descriptor containing the Dgraph schema string:

```javascript
let tmpDescriptor = _Fable.MeadowDGraphProvider.generateCreateTableStatement(tmpSchema);
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

The descriptor object contains:

| Property | Type | Description |
|----------|------|-------------|
| `operation` | string | Always `'alterSchema'` |
| `schema` | string | The Dgraph schema string |
| `typeName` | string | The type name from `TableName` |

### createTable()

Apply the schema to a connected Dgraph instance:

```javascript
_Fable.MeadowDGraphProvider.createTable(tmpSchema,
	(pError) =>
	{
		if (pError)
		{
			console.error('Schema failed:', pError);
			return;
		}
		console.log('Animal schema applied');
	});
```

This calls `client.alter({ schema: ... })` internally.

### createTables()

Apply multiple schemas from a full Meadow schema:

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

Schemas are applied sequentially using `fable.Utility.eachLimit` with concurrency 1.

---

## Drop Type Descriptor

```javascript
let tmpDropDescriptor = _Fable.MeadowDGraphProvider.generateDropTableStatement('Animal');
console.log(tmpDropDescriptor);
```

Output:

```javascript
{ operation: 'dropType', type: 'Animal' }
```

This returns a descriptor object. To actually drop the type in Dgraph, you would use the client's alter API:

```javascript
_Fable.MeadowDGraphProvider.pool.alter({ dropAttr: 'Animal' });
```

---

## Comparison with SQL DDL

### SQL CREATE TABLE vs Dgraph Schema

| Feature | SQL (MySQL/MSSQL/SQLite) | Dgraph |
|---------|--------------------------|--------|
| Structure | `CREATE TABLE ... (columns)` | Predicate declarations + type definition |
| Column types | `INT`, `VARCHAR(n)`, `TEXT`, `DATETIME` | `int`, `float`, `string`, `datetime` |
| Size constraints | Enforced (`VARCHAR(255)`) | None (ignored) |
| Primary key | `AUTO_INCREMENT` / `IDENTITY` / `AUTOINCREMENT` | UID (assigned by Dgraph) |
| Indexes | Created separately or inline | Inline `@index(...)` on each predicate |
| Foreign keys | `INT` column + JOIN | Edges between nodes |
| Default values | `DEFAULT ''` / `DEFAULT 0` | None (graph semantics) |
| Idempotent | `IF NOT EXISTS` / `IF OBJECT_ID` | Always additive (safe to re-apply) |

### Key Differences

- **No table boundaries** -- Dgraph predicates are global. A predicate named `Name` is shared across all types. The `type` definition groups them for query filtering (`func: type(Animal)`).
- **UID vs auto-increment** -- Dgraph assigns a `uid` to every node automatically. The `ID` Meadow type maps to an application-level integer, not the Dgraph UID.
- **Edges vs foreign keys** -- In SQL, relationships use foreign key columns and JOINs. In Dgraph, relationships are edges between nodes, traversed naturally in DQL.
- **Additive schemas** -- Dgraph schema alterations are additive. Re-applying a schema does not fail or duplicate predicates.

---

## Related

- [API Reference](api/reference.md) -- Full API documentation
- [generateCreateTableStatement](api/generateCreateTableStatement.md) -- Function reference
- [createTable](api/createTable.md) -- Function reference
- [createTables](api/createTables.md) -- Function reference
