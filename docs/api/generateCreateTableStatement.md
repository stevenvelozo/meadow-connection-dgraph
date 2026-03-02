# generateCreateTableStatement(pMeadowTableSchema)

Generates Dgraph predicate declarations and a type definition from a Meadow table schema object. Returns a descriptor without applying the schema.

## Signature

```javascript
generateCreateTableStatement(pMeadowTableSchema)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMeadowTableSchema` | `object` | Meadow table schema with `TableName` and `Columns` array |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `operation` | `string` | Always `'alterSchema'` |
| `schema` | `string` | The Dgraph schema string (predicates + type definition) |
| `typeName` | `string` | The type name from `TableName` |

## Schema Object Format

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

## Basic Usage

```javascript
let tmpDescriptor = _Fable.MeadowDGraphProvider.generateCreateTableStatement(tmpSchema);
console.log(tmpDescriptor.operation);  // => 'alterSchema'
console.log(tmpDescriptor.typeName);   // => 'Animal'
console.log(tmpDescriptor.schema);
```

Output schema string:

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

## Type Mapping

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
| Default | `string` | (none) |

## Schema Structure

The generated schema has two parts:

1. **Predicate declarations** -- One line per column, declaring the type and index
2. **Type definition** -- A `type` block listing all predicates belonging to this type

### Predicate Format

```
<name>: <dgraph_type> <index_directive> .
```

### Type Definition Format

```
type <TypeName> {
	<predicate1>
	<predicate2>
	...
}
```

## Differences from SQL DDL

| Feature | SQL Connectors | Dgraph |
|---------|---------------|--------|
| Output | SQL `CREATE TABLE` string | Descriptor object with schema string |
| Column types | `INT`, `VARCHAR`, `TEXT` | `int`, `float`, `string`, `datetime` |
| Size constraints | Enforced | Ignored |
| Primary key | Inline declaration | UID assigned by Dgraph |
| Indexes | Separate or inline | Per-predicate `@index(...)` |
| Idempotent | `IF NOT EXISTS` | Always additive |

## Related

- [createTable](createTable.md) -- Generate and apply schema
- [createTables](createTables.md) -- Apply multiple schemas
- [generateDropTableStatement](generateDropTableStatement.md) -- Generate drop descriptor
- [Schema & Predicates](../schema.md) -- Full type mapping documentation
