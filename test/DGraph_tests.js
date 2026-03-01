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
						var tmpFable = new libFable({Product:'DGraphConnectionTest', DGraph:{Server:'localhost', Port:8080}});
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
						var tmpFable = new libFable({Product:'DGraphConnectionTest', DGraph:{Server:'localhost', Port:8080}});
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
						var tmpFable = new libFable({Product:'DGraphConnectionTest', DGraph:{Server:'localhost', Port:8080}});
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
	}
);
