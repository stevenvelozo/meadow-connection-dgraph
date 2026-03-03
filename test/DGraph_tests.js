/**
* Unit tests for Meadow DGraph Connection
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require('chai');
var Expect = Chai.expect;

var libFable = require('fable');
var libMeadowConnectionDGraph = require('../source/Meadow-Connection-DGraph.js');

var _FableConfig = (
	{
		"Product": "MeadowDGraphConnectionTest",
		"ProductVersion": "1.0.0",

		"UUID":
			{
				"DataCenter": 0,
				"Worker": 0
			},
		"LogStreams":
			[
				{
					"streamtype": "console"
				}
			],

		"DGraph":
			{
				"Server": "127.0.0.1",
				"Port": 48080
			}
	});

var _AnimalSchema = {
	TableName: 'Animal',
	Columns: [
		{ Column: 'IDAnimal', DataType: 'ID' },
		{ Column: 'GUIDAnimal', DataType: 'GUID' },
		{ Column: 'Name', DataType: 'String' },
		{ Column: 'Age', DataType: 'Numeric' },
		{ Column: 'Weight', DataType: 'Decimal' },
		{ Column: 'Description', DataType: 'Text' },
		{ Column: 'Birthday', DataType: 'DateTime' },
		{ Column: 'Active', DataType: 'Boolean' },
		{ Column: 'IDFarm', DataType: 'ForeignKey' }
	]
};

var _VehicleSchema = {
	TableName: 'Vehicle',
	Columns: [
		{ Column: 'IDVehicle', DataType: 'ID' },
		{ Column: 'GUIDVehicle', DataType: 'GUID' },
		{ Column: 'Make', DataType: 'String' },
		{ Column: 'Model', DataType: 'String' },
		{ Column: 'Year', DataType: 'Numeric' }
	]
};

/**
 * Drop all data from DGraph via HTTP POST to /alter.
 * This is used for test cleanup between suites.
 */
var dropAllDGraphData = function (pPort, fCallback)
{
	var http = require('http');
	var tmpOptions = {
		hostname: '127.0.0.1',
		port: pPort,
		path: '/alter',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	};
	var tmpReq = http.request(tmpOptions, function (pRes)
	{
		pRes.on('data', function () {});
		pRes.on('end', function () { fCallback(); });
	});
	tmpReq.on('error', function (pError) { fCallback(pError); });
	tmpReq.write(JSON.stringify({ drop_all: true }));
	tmpReq.end();
};

suite
(
	'Meadow-Connection-DGraph',
	function()
	{
		suite
		(
			'Object Sanity',
			function()
			{
				test
				(
					'The class should initialize',
					function()
					{
						var tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowProvider', libMeadowConnectionDGraph);
						var tmpProvider = tmpFable.serviceManager.instantiateServiceProvider('MeadowProvider');
						Expect(tmpProvider).to.be.an('object');
						Expect(tmpProvider.serviceType).to.equal('MeadowConnectionDGraph');
						Expect(tmpProvider.connected).to.equal(false);
					}
				);
			}
		);

		suite
		(
			'Configuration',
			function()
			{
				test
				(
					'use default settings from fable.settings',
					function()
					{
						var tmpFable = new libFable({Product:'DGraphConnectionTest', DGraph:{Server:'dgraph-alpha', Port:9080}});
						tmpFable.serviceManager.addServiceType('MeadowProvider', libMeadowConnectionDGraph);
						var tmpProvider = tmpFable.serviceManager.instantiateServiceProvider('MeadowProvider');
						Expect(tmpProvider.options.DGraph.host).to.equal('dgraph-alpha');
						Expect(tmpProvider.options.DGraph.port).to.equal(9080);
					}
				);
				test
				(
					'use pass-in options with Meadow-style property names',
					function()
					{
						var tmpFable = new libFable({Product:'DGraphConnectionTest'});
						tmpFable.serviceManager.addServiceType('MeadowProvider', libMeadowConnectionDGraph);
						var tmpProvider = tmpFable.serviceManager.instantiateServiceProvider('MeadowProvider',
						{
							DGraph: { Server: 'my-dgraph.local', Port: 9999, AuthToken: 'secret123' }
						});
						Expect(tmpProvider.options.DGraph.host).to.equal('my-dgraph.local');
						Expect(tmpProvider.options.DGraph.port).to.equal(9999);
						Expect(tmpProvider.options.DGraph.authToken).to.equal('secret123');
					}
				);
			}
		);

		suite
		(
			'DDL Generation',
			function()
			{
				test
				(
					'generate a DGraph type/predicate schema for a table',
					function()
					{
						var tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowProvider', libMeadowConnectionDGraph);
						var tmpProvider = tmpFable.serviceManager.instantiateServiceProvider('MeadowProvider');

						var tmpResult = tmpProvider.generateCreateTableStatement(
						{
							TableName: 'Animal',
							Columns: [
								{ Column: 'IDAnimal', DataType: 'ID' },
								{ Column: 'GUIDAnimal', DataType: 'GUID' },
								{ Column: 'Name', DataType: 'String' },
								{ Column: 'Age', DataType: 'Numeric' },
								{ Column: 'Weight', DataType: 'Decimal' },
								{ Column: 'CreateDate', DataType: 'DateTime' },
								{ Column: 'Deleted', DataType: 'Boolean' },
								{ Column: 'Description', DataType: 'Text' },
								{ Column: 'IDFarm', DataType: 'ForeignKey' }
							]
						});

						Expect(tmpResult.operation).to.equal('alterSchema');
						Expect(tmpResult.typeName).to.equal('Animal');
						Expect(tmpResult.schema).to.contain('IDAnimal: int @index(int) .');
						Expect(tmpResult.schema).to.contain('GUIDAnimal: string @index(exact) .');
						Expect(tmpResult.schema).to.contain('Name: string @index(exact, term) .');
						Expect(tmpResult.schema).to.contain('Age: int @index(int) .');
						Expect(tmpResult.schema).to.contain('Weight: float @index(float) .');
						Expect(tmpResult.schema).to.contain('CreateDate: datetime @index(hour) .');
						Expect(tmpResult.schema).to.contain('Deleted: int @index(int) .');
						Expect(tmpResult.schema).to.contain('Description: string @index(fulltext) .');
						Expect(tmpResult.schema).to.contain('IDFarm: int @index(int) .');
						Expect(tmpResult.schema).to.contain('type Animal {');
					}
				);
				test
				(
					'generate a drop type descriptor',
					function()
					{
						var tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowProvider', libMeadowConnectionDGraph);
						var tmpProvider = tmpFable.serviceManager.instantiateServiceProvider('MeadowProvider');

						var tmpResult = tmpProvider.generateDropTableStatement('Animal');
						Expect(tmpResult.operation).to.equal('dropType');
						Expect(tmpResult.type).to.equal('Animal');
					}
				);
			}
		);

		suite
		(
			'Connection URL',
			function()
			{
				test
				(
					'build connection URL without auth',
					function()
					{
						var tmpFable = new libFable({Product:'DGraphConnectionTest', DGraph:{Server:'dgraph.example.com', Port:8080}});
						tmpFable.serviceManager.addServiceType('MeadowProvider', libMeadowConnectionDGraph);
						var tmpProvider = tmpFable.serviceManager.instantiateServiceProvider('MeadowProvider');
						Expect(tmpProvider._buildConnectionURL()).to.equal('http://dgraph.example.com:8080');
					}
				);
				test
				(
					'build connection URL with default settings',
					function()
					{
						var tmpFable = new libFable({Product:'DGraphConnectionTest', DGraph:{Server:'localhost'}});
						tmpFable.serviceManager.addServiceType('MeadowProvider', libMeadowConnectionDGraph);
						var tmpProvider = tmpFable.serviceManager.instantiateServiceProvider('MeadowProvider');
						Expect(tmpProvider._buildConnectionURL()).to.equal('http://localhost:8080');
					}
				);
			}
		);

		suite
		(
			'Connection',
			function()
			{
				test
				(
					'connect with default fable.settings',
					function(fDone)
					{
						var tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
						tmpFable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');

						Expect(tmpFable.MeadowDGraphProvider.connected).to.equal(false);

						tmpFable.MeadowDGraphProvider.connect();

						Expect(tmpFable.MeadowDGraphProvider.connected).to.equal(true);
						Expect(tmpFable.MeadowDGraphProvider.pool).to.be.an('object');
						Expect(tmpFable.MeadowDGraphProvider.stub).to.be.an('object');

						// Verify we can actually communicate with DGraph
						tmpFable.MeadowDGraphProvider.pool.getHealth()
							.then(function(pResult)
							{
								Expect(pResult).to.be.an('array');
								Expect(pResult.length).to.be.greaterThan(0);
								return fDone();
							})
							.catch(function(pError)
							{
								return fDone(pError);
							});
					}
				);
				test
				(
					'connectAsync callback',
					function(fDone)
					{
						var tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
						tmpFable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');

						tmpFable.MeadowDGraphProvider.connectAsync(
							function(pError, pClient)
							{
								Expect(pError).to.equal(null);
								Expect(pClient).to.be.an('object');
								Expect(tmpFable.MeadowDGraphProvider.connected).to.equal(true);
								Expect(tmpFable.MeadowDGraphProvider.pool).to.equal(pClient);

								return fDone();
							});
					}
				);
				test
				(
					'autoconnect via MeadowConnectionDGraphAutoConnect',
					function(fDone)
					{
						var tmpConfig = JSON.parse(JSON.stringify(_FableConfig));
						tmpConfig.MeadowConnectionDGraphAutoConnect = true;

						var tmpFable = new libFable(tmpConfig);
						tmpFable.serviceManager.addAndInstantiateServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);

						Expect(tmpFable.MeadowDGraphProvider.connected).to.equal(true);
						Expect(tmpFable.MeadowDGraphProvider.pool).to.be.an('object');

						tmpFable.MeadowDGraphProvider.pool.getHealth()
							.then(function(pResult)
							{
								Expect(pResult).to.be.an('array');
								return fDone();
							})
							.catch(function(pError)
							{
								return fDone(pError);
							});
					}
				);
				test
				(
					'connect when already connected logs error and does not throw',
					function()
					{
						var tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
						tmpFable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');

						tmpFable.MeadowDGraphProvider.connect();
						Expect(tmpFable.MeadowDGraphProvider.connected).to.equal(true);

						// Second connect should not throw
						tmpFable.MeadowDGraphProvider.connect();
						Expect(tmpFable.MeadowDGraphProvider.connected).to.equal(true);
					}
				);
				test
				(
					'pass in your own settings and connect',
					function(fDone)
					{
						var tmpFable = new libFable();
						tmpFable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
						tmpFable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider', {DGraph: _FableConfig.DGraph});

						tmpFable.MeadowDGraphProvider.connect();

						Expect(tmpFable.MeadowDGraphProvider.connected).to.equal(true);

						tmpFable.MeadowDGraphProvider.pool.getHealth()
							.then(function(pResult)
							{
								Expect(pResult).to.be.an('array');
								return fDone();
							})
							.catch(function(pError)
							{
								return fDone(pError);
							});
					}
				);
			}
		);

		suite
		(
			'Schema Execution',
			function()
			{
				var _Fable = null;

				suiteSetup
				(
					function(fDone)
					{
						dropAllDGraphData(_FableConfig.DGraph.Port, function()
						{
							_Fable = new libFable(_FableConfig);
							_Fable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
							_Fable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');
							_Fable.MeadowDGraphProvider.connect();
							fDone();
						});
					}
				);

				suiteTeardown
				(
					function(fDone)
					{
						dropAllDGraphData(_FableConfig.DGraph.Port, function()
						{
							fDone();
						});
					}
				);

				test
				(
					'createTable applies schema via alter',
					function(fDone)
					{
						_Fable.MeadowDGraphProvider.createTable(_AnimalSchema,
							function(pError)
							{
								Expect(pError).to.not.be.an('error');

								// Verify schema was applied by inserting a test node
								var tmpTxn = _Fable.MeadowDGraphProvider.pool.newTxn();
								tmpTxn.mutate({
									setJson: { 'dgraph.type': 'Animal', IDAnimal: 999, Name: 'SchemaTest' },
									commitNow: true
								})
								.then(function()
								{
									// Query to verify the node exists
									var tmpReadTxn = _Fable.MeadowDGraphProvider.pool.newTxn({ readOnly: true });
									return tmpReadTxn.query('{ animals(func: eq(IDAnimal, 999)) { IDAnimal Name } }');
								})
								.then(function(pResult)
								{
									Expect(pResult.data.animals).to.be.an('array');
									Expect(pResult.data.animals.length).to.equal(1);
									Expect(pResult.data.animals[0].Name).to.equal('SchemaTest');
									return fDone();
								})
								.catch(function(pError)
								{
									return fDone(pError);
								});
							});
					}
				);
				test
				(
					'createTable is idempotent',
					function(fDone)
					{
						// Call createTable again for the same schema — should not error
						_Fable.MeadowDGraphProvider.createTable(_AnimalSchema,
							function(pError)
							{
								Expect(pError).to.not.be.an('error');
								return fDone();
							});
					}
				);
				test
				(
					'createTables creates multiple types',
					function(fDone)
					{
						var tmpMultiSchema = {
							Tables: [_AnimalSchema, _VehicleSchema]
						};

						_Fable.MeadowDGraphProvider.createTables(tmpMultiSchema,
							function(pError)
							{
								Expect(pError).to.not.be.an('error');

								// Verify Vehicle schema by inserting a vehicle node
								var tmpTxn = _Fable.MeadowDGraphProvider.pool.newTxn();
								tmpTxn.mutate({
									setJson: { 'dgraph.type': 'Vehicle', IDVehicle: 1, Make: 'Toyota' },
									commitNow: true
								})
								.then(function()
								{
									return fDone();
								})
								.catch(function(pError)
								{
									return fDone(pError);
								});
							});
					}
				);
				test
				(
					'createTable when not connected returns error',
					function(fDone)
					{
						// Create a disconnected provider (no connect() call)
						var tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
						tmpFable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');

						tmpFable.MeadowDGraphProvider.createTable(_AnimalSchema,
							function(pError)
							{
								Expect(pError).to.be.an('error');
								Expect(pError.message).to.contain('Not connected');
								return fDone();
							});
					}
				);
			}
		);

		suite
		(
			'Raw DGraph Operations',
			function()
			{
				var _Fable = null;

				suiteSetup
				(
					function(fDone)
					{
						// Drop all data, then connect and apply schema
						dropAllDGraphData(_FableConfig.DGraph.Port, function(pError)
						{
							if (pError)
							{
								return fDone(pError);
							}

							_Fable = new libFable(_FableConfig);
							_Fable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
							_Fable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');
							_Fable.MeadowDGraphProvider.connect();

							// Apply the Animal schema
							_Fable.MeadowDGraphProvider.createTable(_AnimalSchema, function(pCreateError)
							{
								if (pCreateError)
								{
									return fDone(pCreateError);
								}
								return fDone();
							});
						});
					}
				);

				suiteTeardown
				(
					function(fDone)
					{
						dropAllDGraphData(_FableConfig.DGraph.Port, function()
						{
							fDone();
						});
					}
				);

				test
				(
					'insert and query data via mutations',
					function(fDone)
					{
						var tmpTxn = _Fable.MeadowDGraphProvider.pool.newTxn();
						tmpTxn.mutate({
							setJson: [
								{ 'dgraph.type': 'Animal', IDAnimal: 1, Name: 'Fido', Age: 5 },
								{ 'dgraph.type': 'Animal', IDAnimal: 2, Name: 'Whiskers', Age: 3 },
								{ 'dgraph.type': 'Animal', IDAnimal: 3, Name: 'Polly', Age: 7 }
							],
							commitNow: true
						})
						.then(function()
						{
							var tmpReadTxn = _Fable.MeadowDGraphProvider.pool.newTxn({ readOnly: true });
							return tmpReadTxn.query('{ animals(func: type(Animal), orderasc: IDAnimal) { IDAnimal Name Age } }');
						})
						.then(function(pResult)
						{
							Expect(pResult.data.animals).to.be.an('array');
							Expect(pResult.data.animals.length).to.equal(3);
							Expect(pResult.data.animals[0].Name).to.equal('Fido');
							Expect(pResult.data.animals[1].Name).to.equal('Whiskers');
							Expect(pResult.data.animals[2].Name).to.equal('Polly');
							return fDone();
						})
						.catch(function(pError)
						{
							return fDone(pError);
						});
					}
				);
				test
				(
					'update data via mutation',
					function(fDone)
					{
						// First query for the uid of IDAnimal=1
						var tmpReadTxn = _Fable.MeadowDGraphProvider.pool.newTxn({ readOnly: true });
						tmpReadTxn.query('{ animal(func: eq(IDAnimal, 1)) { uid Name } }')
							.then(function(pResult)
							{
								Expect(pResult.data.animal).to.be.an('array');
								Expect(pResult.data.animal.length).to.equal(1);
								var tmpUid = pResult.data.animal[0].uid;

								// Update the Name
								var tmpTxn = _Fable.MeadowDGraphProvider.pool.newTxn();
								return tmpTxn.mutate({
									setJson: { uid: tmpUid, Name: 'Rex' },
									commitNow: true
								});
							})
							.then(function()
							{
								// Verify the update
								var tmpVerifyTxn = _Fable.MeadowDGraphProvider.pool.newTxn({ readOnly: true });
								return tmpVerifyTxn.query('{ animal(func: eq(IDAnimal, 1)) { uid Name } }');
							})
							.then(function(pResult)
							{
								Expect(pResult.data.animal[0].Name).to.equal('Rex');
								return fDone();
							})
							.catch(function(pError)
							{
								return fDone(pError);
							});
					}
				);
				test
				(
					'delete data via mutation',
					function(fDone)
					{
						// Find the uid of IDAnimal=3
						var tmpReadTxn = _Fable.MeadowDGraphProvider.pool.newTxn({ readOnly: true });
						tmpReadTxn.query('{ animal(func: eq(IDAnimal, 3)) { uid } }')
							.then(function(pResult)
							{
								Expect(pResult.data.animal).to.be.an('array');
								Expect(pResult.data.animal.length).to.equal(1);
								var tmpUid = pResult.data.animal[0].uid;

								// Delete the node
								var tmpTxn = _Fable.MeadowDGraphProvider.pool.newTxn();
								return tmpTxn.mutate({
									deleteJson: { uid: tmpUid },
									commitNow: true
								});
							})
							.then(function()
							{
								// Verify only 2 remain
								var tmpVerifyTxn = _Fable.MeadowDGraphProvider.pool.newTxn({ readOnly: true });
								return tmpVerifyTxn.query('{ animals(func: type(Animal)) { uid } }');
							})
							.then(function(pResult)
							{
								Expect(pResult.data.animals).to.be.an('array');
								Expect(pResult.data.animals.length).to.equal(2);
								return fDone();
							})
							.catch(function(pError)
							{
								return fDone(pError);
							});
					}
				);
				test
				(
					'count nodes with a filter',
					function(fDone)
					{
						var tmpReadTxn = _Fable.MeadowDGraphProvider.pool.newTxn({ readOnly: true });
						tmpReadTxn.query('{ count(func: type(Animal)) { total: count(uid) } }')
							.then(function(pResult)
							{
								Expect(pResult.data.count).to.be.an('array');
								Expect(pResult.data.count[0].total).to.equal(2);
								return fDone();
							})
							.catch(function(pError)
							{
								return fDone(pError);
							});
					}
				);
			}
		);
	}
);
