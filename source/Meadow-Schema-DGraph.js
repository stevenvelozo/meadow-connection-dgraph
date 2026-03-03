/**
* Meadow DGraph Schema Provider
*
* Handles type creation, dropping, and schema generation for DGraph.
* Separated from the connection provider to allow independent extension
* for indexing and other schema operations.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');

class MeadowSchemaDGraph extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowSchemaDGraph';

		// Reference to the DGraph client, set by the connection provider
		this._Client = false;
	}

	/**
	 * Set the client reference for executing schema operations.
	 * @param {object} pClient - DGraph client instance
	 * @returns {MeadowSchemaDGraph} this (for chaining)
	 */
	setClient(pClient)
	{
		this._Client = pClient;
		return this;
	}

	generateDropTableStatement(pTableName)
	{
		// Returns a descriptor for dropping a DGraph type
		return { operation: 'dropType', type: pTableName };
	}

	generateCreateTableStatement(pMeadowTableSchema)
	{
		this.log.info(`--> Building the DGraph schema for ${pMeadowTableSchema.TableName} ...`);

		let tmpPredicates = [];
		let tmpTypeFields = [];

		for (let j = 0; j < pMeadowTableSchema.Columns.length; j++)
		{
			let tmpColumn = pMeadowTableSchema.Columns[j];
			let tmpPredName = tmpColumn.Column;
			let tmpPredType = 'string';
			let tmpIndex = '';

			switch (tmpColumn.DataType)
			{
				case 'ID':
					tmpPredType = 'int';
					tmpIndex = ' @index(int)';
					break;
				case 'GUID':
					tmpPredType = 'string';
					tmpIndex = ' @index(exact)';
					break;
				case 'ForeignKey':
					tmpPredType = 'int';
					tmpIndex = ' @index(int)';
					break;
				case 'Numeric':
					tmpPredType = 'int';
					tmpIndex = ' @index(int)';
					break;
				case 'Decimal':
					tmpPredType = 'float';
					tmpIndex = ' @index(float)';
					break;
				case 'String':
					tmpPredType = 'string';
					tmpIndex = ' @index(exact, term)';
					break;
				case 'Text':
					tmpPredType = 'string';
					tmpIndex = ' @index(fulltext)';
					break;
				case 'DateTime':
					tmpPredType = 'datetime';
					tmpIndex = ' @index(hour)';
					break;
				case 'Boolean':
					tmpPredType = 'int';
					tmpIndex = ' @index(int)';
					break;
				default:
					tmpPredType = 'string';
					tmpIndex = '';
					break;
			}

			tmpPredicates.push(`${tmpPredName}: ${tmpPredType}${tmpIndex} .`);
			tmpTypeFields.push(tmpPredName);
		}

		let tmpSchema = tmpPredicates.join('\n') + '\n' +
			'type ' + pMeadowTableSchema.TableName + ' {\n' +
			tmpTypeFields.map((pField) => { return '\t' + pField; }).join('\n') + '\n' +
			'}';

		return {
			operation: 'alterSchema',
			schema: tmpSchema,
			typeName: pMeadowTableSchema.TableName
		};
	}

	createTables(pMeadowSchema, fCallback)
	{
		this.fable.Utility.eachLimit(pMeadowSchema.Tables, 1,
			(pTable, fCreateComplete) =>
			{
				return this.createTable(pTable, fCreateComplete);
			},
			(pCreateError) =>
			{
				if (pCreateError)
				{
					this.log.error(`Meadow-DGraph Error creating schemas: ${pCreateError}`, pCreateError);
				}
				this.log.info('Done creating DGraph schemas!');
				return fCallback(pCreateError);
			});
	}

	createTable(pMeadowTableSchema, fCallback)
	{
		let tmpDescriptor = this.generateCreateTableStatement(pMeadowTableSchema);

		if (!this._Client)
		{
			this.log.error(`Meadow-DGraph CREATE SCHEMA for ${tmpDescriptor.typeName} failed: not connected.`);
			return fCallback(new Error('Not connected to DGraph'));
		}

		this._Client.alter({ schema: tmpDescriptor.schema })
			.then(() =>
			{
				this.log.info(`Meadow-DGraph schema for ${tmpDescriptor.typeName} applied successfully.`);
				return fCallback();
			})
			.catch((pError) =>
			{
				this.log.error(`Meadow-DGraph CREATE SCHEMA for ${tmpDescriptor.typeName} failed!`, pError);
				return fCallback(pError);
			});
	}
}

module.exports = MeadowSchemaDGraph;
