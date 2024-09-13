# @acro-sdk/opensearch-store

## Usage

```typescript
import { OpenSearchEngine, OpenSearchAction } from '@acro-sdk/opensearch-store';

const engine = new OpenSearchEngine({}, {
  node: `${protocol}://${host}:${port}`
  // for Amazon OpenSearch, have to do a lot more configuration here
  // https://opensearch.org/docs/latest/clients/javascript/index/#authenticating-with-amazon-opensearch-service-aws-signature-version-4
});

const createdAction: Action = await engine.createAction(action);
```

## Development

Install OpenSearch on your local machine: https://opensearch.org/docs/latest/install-and-configure/install-opensearch/docker/

```bash
docker pull opensearchproject/opensearch:2
```

Run it for the first time with an admin password:

```bash
 docker run -d -p 9200:9200 -p 9600:9600 -e "discovery.type=single-node" -e "OPENSEARCH_INITIAL_ADMIN_PASSWORD=<custom-admin-password>" -e 'DISABLE_SECURITY_PLUGIN=true' opensearchproject/opensearch:latest
```

You can now send commands as follows:

```bash
curl http://localhost:9200 -ku admin:<custom-admin-password>

{
  "name" : "ec4f9e231c47",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "vzBL1TnqSb6Ejm2ZjtyFBw",
  "version" : {
    "distribution" : "opensearch",
    "number" : "2.16.0",
    "build_type" : "tar",
    "build_hash" : "f84a26e76807ea67a69822c37b1a1d89e7177d9b",
    "build_date" : "2024-08-06T20:32:34.547531562Z",
    "build_snapshot" : false,
    "lucene_version" : "9.11.1",
    "minimum_wire_compatibility_version" : "7.10.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "The OpenSearch Project: https://opensearch.org/"
}
```

Or use this library against your local OpenSearch instance by initializing it in an app:

```typescript
import { OpenSearchEngine } from "@acro-sdk/opensearch-store";

const engine = new OpenSearchEngine(
  {
    logLevel: LogLevel.debug, // show all messages for fun
  },
  {
    node: `http://admin:<custom-admin-password>@localhost:9200`,
  }
);

try {
  // note this action is a standard Action object, not the OpenSearchAction!
  const action = await engine.createAction({
    app: "pay-links",
    timestamp: "2024-09-07T07:04:30.596Z",
    environment: "development",
    framework: {
      name: "express",
      version: "4.19.2",
    },
    action: {
      object: "/v1/businesses/:businessId/transactions",
      type: "HTTP",
      verb: "POST",
    },
    companyId: "e26b41e2-64b6-45b8-b633-4149bc0c4e7f",
    clientId: "c28e3945-7184-4494-8314-1e32d8d3f363",
    //... rest of action here
  });
} catch (err) {
  // do something with error
}
```

Can create a single action as above, or many:

```typescript
import { OpenSearchEngine } from "@acro-sdk/opensearch-store";

const engine = new OpenSearchEngine(
  {
    logLevel: LogLevel.debug, // show all messages for fun
  },
  {
    node: `http://admin:<custom-admin-password>@localhost:9200`,
  }
);

try {
  // note this action is a standard Action object, not the OpenSearchAction!
  const actions = await engine.createManyActions([
    {
      app: "pay-links",
      timestamp: "2024-09-07T07:04:30.596Z",
      environment: "development",
      framework: {
        name: "express",
        version: "4.19.2",
      },
      action: {
        object: "/v1/businesses/:businessId/transactions",
        type: "HTTP",
        verb: "POST",
      },
      companyId: "e26b41e2-64b6-45b8-b633-4149bc0c4e7f",
      clientId: "c28e3945-7184-4494-8314-1e32d8d3f363",
      //... rest of action here
    },
    //... other actions here
  ]);
} catch (err) {
  // do something with error
}
```