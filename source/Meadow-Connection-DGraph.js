/**
* Meadow DGraph Provider Fable Service
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');

let libDgraph = false;
try
{
	libDgraph = require('dgraph-js-http');
}
catch(pError)
{
	// dgraph-js-http not available; connection will fail gracefully
}

class MeadowConnectionDGraph extends libFableServiceProviderBase
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.serviceType = 'MeadowConnectionDGraph';

		// See if the user passed in a DGraph object already
		if (typeof(this.options.DGraph) == 'object')
		{
			// Support Meadow-style property names
			if (!this.options.DGraph.hasOwnProperty('host') && this.options.DGraph.hasOwnProperty('Server'))
			{
				this.options.DGraph.host = this.options.DGraph.Server;
			}
			if (!this.options.DGraph.hasOwnProperty('port') && this.options.DGraph.hasOwnProperty('Port'))
			{
				this.options.DGraph.port = this.options.DGraph.Port;
			}
			if (!this.options.DGraph.hasOwnProperty('authToken') && this.options.DGraph.hasOwnProperty('AuthToken'))
			{
				this.options.DGraph.authToken = this.options.DGraph.AuthToken;
			}
		}
		else if (typeof(this.fable.settings.DGraph) == 'object')
		{
			this.options.DGraph = (
				{
					host: this.fable.settings.DGraph.Server || 'localhost',
					port: this.fable.settings.DGraph.Port || 8080,
					authToken: this.fable.settings.DGraph.AuthToken || ''
				});
		}

		if (!this.options.MeadowConnectionDGraphAutoConnect)
		{
			this.options.MeadowConnectionDGraphAutoConnect = this.fable.settings.MeadowConnectionDGraphAutoConnect;
		}

		this._ClientStub = false;
		this._Client = false;
		this.connected = false;

		if (this.options.MeadowConnectionDGraphAutoConnect)
		{
			this.connect();
		}
	}

	/**
	* Build the DGraph HTTP endpoint URL from options.
	*/
	_buildConnectionURL()
	{
		let tmpOptions = this.options.DGraph || {};
		let tmpHost = tmpOptions.host || 'localhost';
		let tmpPort = tmpOptions.port || 8080;

		return `http://${tmpHost}:${tmpPort}`;
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

	connect()
	{
		if (this._Client)
		{
			this.log.error(`Meadow-Connection-DGraph trying to connect but is already connected - skipping.`);
			return;
		}

		if (!libDgraph)
		{
			this.log.error(`Meadow-Connection-DGraph: dgraph-js-http is not installed.`);
			return;
		}

		let tmpURL = this._buildConnectionURL();
		let tmpOptions = this.options.DGraph || {};

		this.fable.log.info(`Meadow-Connection-DGraph connecting to [${tmpURL}]`);

		this._ClientStub = new libDgraph.DgraphClientStub(tmpURL);
		this._Client = new libDgraph.DgraphClient(this._ClientStub);

		// Optional auth token
		if (tmpOptions.authToken)
		{
			this._Client.setAlphaAuthToken(tmpOptions.authToken);
		}

		this.connected = true;
	}

	connectAsync(fCallback)
	{
		let tmpCallback = fCallback;
		if (typeof (tmpCallback) !== 'function')
		{
			this.log.error(`Meadow DGraph connectAsync() called without a callback.`);
			tmpCallback = () => { };
		}

		try
		{
			if (this._Client)
			{
				return tmpCallback(null, this._Client);
			}
			else
			{
				this.connect();
				return tmpCallback(null, this._Client);
			}
		}
		catch(pError)
		{
			this.log.error(`Meadow DGraph connectAsync() error: ${pError}`, pError);
			return tmpCallback(pError);
		}
	}

	/**
	* Returns the DGraph client instance (analogous to pool in SQL drivers).
	*/
	get pool()
	{
		return this._Client;
	}

	/**
	* Returns the raw client stub.
	*/
	get stub()
	{
		return this._ClientStub;
	}
}

module.exports = MeadowConnectionDGraph;
