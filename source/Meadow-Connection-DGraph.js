/**
* Meadow DGraph Provider Fable Service
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');

const libMeadowSchemaDGraph = require('./Meadow-Schema-DGraph.js');

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

		// Schema provider handles DDL operations (create, drop, index, etc.)
		this._SchemaProvider = new libMeadowSchemaDGraph(this.fable, this.options, `${this.Hash}-Schema`);

		if (this.options.MeadowConnectionDGraphAutoConnect)
		{
			this.connect();
		}
	}

	get schemaProvider()
	{
		return this._SchemaProvider;
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
		return this._SchemaProvider.generateDropTableStatement(pTableName);
	}

	generateCreateTableStatement(pMeadowTableSchema)
	{
		return this._SchemaProvider.generateCreateTableStatement(pMeadowTableSchema);
	}

	createTables(pMeadowSchema, fCallback)
	{
		return this._SchemaProvider.createTables(pMeadowSchema, fCallback);
	}

	createTable(pMeadowTableSchema, fCallback)
	{
		return this._SchemaProvider.createTable(pMeadowTableSchema, fCallback);
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
		this._SchemaProvider.setClient(this._Client);
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
