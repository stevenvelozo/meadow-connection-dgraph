# Meadow Connection Dgraph

> Dgraph graph database provider for the Meadow data layer

Connect any Fable application to a Dgraph cluster through the service provider pattern. Built on dgraph-js-http for HTTP-based access to Dgraph Alpha, with schema generation from Meadow table definitions and optional auth token support.

- **Graph Database** -- Connect to Dgraph for graph-native data modeling and queries
- **HTTP Client** -- Communicates with Dgraph Alpha over HTTP via dgraph-js-http
- **Schema Generation** -- Generate Dgraph predicates and type definitions from Meadow schemas
- **Auth Token Support** -- Optional Alpha auth token for secured clusters
- **Index Strategies** -- Automatic index directives (exact, term, fulltext, int, float, hour)
- **Service Integration** -- Registers as a Fable service with dependency injection and lifecycle logging

[Quick Start](quickstart.md)
[API Reference](api/reference.md)
[Architecture](architecture.md)
[GitHub](https://github.com/stevenvelozo/meadow-connection-dgraph)
