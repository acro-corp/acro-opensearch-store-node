/**
 * Copyright (C) 2024 Acro Data Solutions, Inc.

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { DateTime, Interval } from "luxon";
import {
  Action,
  Engine,
  LogLevel,
  FindActionOptions,
  FindActionFilters,
} from "@acro-sdk/common-store";
import { Client, ClientOptions } from "@opensearch-project/opensearch";

import { OpenSearchAction, OpenSearchActionSchema } from "./action";
import { transformArrayToObject, transformObjectToArray } from "./utils";
import {
  breakCircularReferences,
  deepCompareObjects,
} from "@acro-sdk/common-store";
import { INDEX_MAPPING } from "./mapping";
import { v4 } from "uuid";

class OpenSearchEngine extends Engine<OpenSearchAction> {
  _client: Client;

  // revolving index names will follow this pattern
  _indexPattern: string = "actions_{companyId}_{year}_{month}";

  // apply dynamic index template to all indexes
  _indexTemplateName: string = "acro_actions";
  _indexTemplatePattern: string = "actions_*";
  _indexTemplateNumShards: number = 5;
  _indexTemplateNumReplicas: number = 1;
  _autoUpdateIndexMappings: boolean = true;

  // default search options
  _defaultStartMonthsAgo: number = 6; // 6 months ago
  _defaultPageSize: number = 25;

  constructor(
    options: {
      indexPattern?: string;
      indexTemplateName?: string;
      indexTemplatePattern?: string;
      indexTemplateNumShards?: number;
      indexTemplateNumReplicas?: number;
      autoUpdateIndexMappings?: boolean;
      logger?: Function;
      logLevel?: LogLevel;
      defaultStartMonthsAgo?: number;
      defaultPageSize?: number;
    },
    clientOptions: ClientOptions
  ) {
    super({ logger: options.logger, logLevel: options.logLevel });

    if (options?.indexPattern) {
      this._indexPattern = options.indexPattern;
    }
    if (options?.indexTemplateName) {
      this._indexTemplateName = options.indexTemplateName;
    }
    if (options?.indexTemplatePattern) {
      this._indexTemplatePattern = options.indexTemplatePattern;
    }
    if (options?.indexTemplateNumShards) {
      this._indexTemplateNumShards = options.indexTemplateNumShards;
    }
    if (options?.indexTemplateNumReplicas) {
      this._indexTemplateNumReplicas = options.indexTemplateNumReplicas;
    }
    if (typeof options?.autoUpdateIndexMappings !== "undefined") {
      this._autoUpdateIndexMappings = options.autoUpdateIndexMappings;
    }
    if (options?.defaultStartMonthsAgo) {
      this._defaultStartMonthsAgo = options.defaultStartMonthsAgo;
    }
    if (options?.defaultPageSize) {
      this._defaultPageSize = options.defaultPageSize;
    }

    this._client = new Client(clientOptions);

    if (this._autoUpdateIndexMappings) {
      this.upsertIndexTemplates();
      this.updateIndexMappings();
    }
  }

  /**
   * Converts an Action into the Action interface used by the DB engine
   * @param {Action} action
   * @returns {OpenSearchAction} action
   */
  async serialize(action: Action): Promise<OpenSearchAction> {
    const agents = action.agents.map((agent) => ({
      ...agent,
      meta: transformObjectToArray(agent.meta),
    }));

    const targets = action.targets?.map((target) => ({
      ...target,
      meta: transformObjectToArray(target.meta),
    }));

    const request = action.request
      ? Object.entries(action.request)
          .flatMap(([key, value]) => {
            if (
              value !== null &&
              typeof value === "object" &&
              !Array.isArray(value)
            ) {
              return Object.entries(value).map(([nestedKey, nestedValue]) => ({
                key: nestedKey,
                parent: key,
                value:
                  typeof nestedValue === "string"
                    ? nestedValue
                    : JSON.stringify(breakCircularReferences(value)),
              }));
            } else {
              return [
                {
                  key,
                  value:
                    typeof value === "string"
                      ? value
                      : JSON.stringify(breakCircularReferences(value)),
                },
              ];
            }
          })
          .filter((v) => v?.value)
      : undefined;

    const response = action.response
      ? {
          ...action.response,
          body: transformObjectToArray(action.response.body),
          headers: transformObjectToArray(action.response.headers),
        }
      : undefined;

    const changes =
      action.changes?.map((change) => {
        return {
          ...change,
          before: change.before
            ? typeof change.before === "string"
              ? change.before
              : JSON.stringify(breakCircularReferences(change.before))
            : undefined,
          after: change.after
            ? typeof change.after === "string"
              ? change.after
              : JSON.stringify(breakCircularReferences(change.after))
            : undefined,
          meta: transformObjectToArray(change.meta),
        };
      }) || undefined;

    const cost = action.cost
      ? {
          ...action.cost,
          meta: transformObjectToArray(action.cost?.meta),
        }
      : undefined;

    const meta = transformObjectToArray(action.meta);

    return {
      ...action,
      agents,
      targets,
      request,
      response,
      changes,
      cost,
      meta,
    };
  }

  /**
   * Converts a DB engine action into the standard Action interface
   * @param {OpenSearchAction} action
   * @returns {Action} action
   */
  async deserialize(action: OpenSearchAction): Promise<Action> {
    const agents = action.agents.map((agent) => ({
      ...agent,
      meta: transformArrayToObject(agent.meta),
    }));

    const targets = action.targets?.map((target) => ({
      ...target,
      meta: transformArrayToObject(target.meta),
    }));

    const request = action.request?.reduce<Record<string, any>>((obj, item) => {
      if (!item.parent) {
        obj[item.key] = item.value;
      } else {
        if (!obj[item.parent]) {
          obj[item.parent] = {};
        }
        (obj[item.parent] as Record<string, any>)[item.key] = item.value;
      }
      return obj;
    }, {});

    const response = action.response
      ? {
          ...action.response,
          ...(action.response?.body
            ? { body: transformArrayToObject(action.response.body) }
            : {}),
          ...(action.response?.headers
            ? { headers: transformArrayToObject(action.response.headers) }
            : {}),
        }
      : undefined;

    const cost = action.cost
      ? {
          ...action.cost,
          meta: transformArrayToObject(action.cost?.meta),
        }
      : undefined;

    const changes = action.changes?.map((change) => ({
      ...change,
      meta: transformArrayToObject(change.meta),
    }));

    const meta = transformArrayToObject(action.meta);

    return {
      ...action,
      agents,
      targets,
      request,
      response,
      cost,
      changes,
      meta,
    };
  }

  /**
   * Creates an DB engine action in the database
   * @param {OpenSearchAction} action
   * @returns {OpenSearchAction} createdAction
   */
  async create(action: OpenSearchAction): Promise<OpenSearchAction> {
    // validate
    OpenSearchActionSchema.parse(action);

    return new Promise(async (resolve, reject) => {
      const id = v4();

      const body = {
        ...action,
        id: action.id || id,
      };

      await this._client
        .index({
          id: body.id,
          index: this.getIndexName(action),
          body,
          refresh: true,
        })
        .then((response) => {
          this.logger.debug(`index success: ${JSON.stringify(response)}`);

          resolve(body as OpenSearchAction);
        })
        .catch((err) => {
          this.logger.error(
            `index error: ${err.statusCode} ${err.name} ${
              err.message
            } ${JSON.stringify(err.body)}`
          );

          reject(err);
        });
    });
  }

  /**
   * Creates several DB engine actions in the database
   * @param {OpenSearchAction[]} actions
   * @returns {OpenSearchAction[]} createdActions
   */
  async createMany(actions: OpenSearchAction[]): Promise<OpenSearchAction[]> {
    const bulk: any = [];
    const dbActions: OpenSearchAction[] = [];

    actions?.forEach((action) => {
      // validate each one; throw error for the whole call if any are bad
      // QUESTION: should we allow the OK ones through or fail all?
      OpenSearchActionSchema.parse(action);

      // generate id if not present
      const id = v4();
      const body = {
        ...action,
        id: action.id || id,
      };

      bulk.push({
        index: {
          _index: this.getIndexName(action),
          _id: body.id,
        },
      });
      bulk.push(body);

      // response is the list of indexed actions
      dbActions.push(body);
    });

    return new Promise(async (resolve, reject) => {
      await this._client
        .bulk({
          body: bulk,
        })
        .then((response) => {
          this.logger.debug(`bulk success: ${JSON.stringify(response)}`);

          resolve(dbActions as OpenSearchAction[]);
        })
        .catch((err) => {
          this.logger.error(
            `bulk error: ${err.statusCode} ${err.name} ${
              err.message
            } ${JSON.stringify(err.body)}`
          );

          reject(err);
        });
    });
  }

  /**
   * Finds and returns a single DB engine action
   * @param {string} id
   * @returns {OpenSearchAction} action
   */
  async findById(id: string): Promise<OpenSearchAction> {
    // TODO: Implement this method
    throw new Error("Method not implemented");
  }

  /**
   * Finds and returns multiple DB engine actions
   * @param {string} id
   * @returns {OpenSearchAction} actions
   */
  async findMany(
    options: FindActionOptions,
    filters: FindActionFilters
  ): Promise<OpenSearchAction[]> {
    return new Promise(async (resolve, reject) => {
      const must = this.buildFindManyQuery(options, filters);

      const body = {
        query: { bool: { must } },
        from:
          ((options.page || 1) - 1) * (options.limit || this._defaultPageSize), // default to page 1
        size: options.limit || this._defaultPageSize, // default to _defaultPageSize aka 25
        sort: [
          // default sort by timestamp descending
          {
            [options.sortBy || "timestamp"]: {
              order: options.sortDirection || "desc",
            },
          },
        ],
      };

      const index = this.getIndexNameRange({
        companyId: filters.companyId,
        start: filters.start,
        end: filters.end,
      });

      this.logger.debug(`findMany query: ${JSON.stringify({ index, body })}`);

      await this._client
        .search({ index, body, ignore_unavailable: true })
        .then((docs) => {
          resolve(docs?.body?.hits?.hits?.map((doc: any) => doc?._source));
        })
        .catch((err) => {
          this.logger.error(
            `findMany error: ${err.statusCode} ${err.name} ${
              err.message
            } ${JSON.stringify(err.body)}`
          );

          reject(err);
        });
    });
  }

  // ------------------------------------------------------------------------------------
  // Below are OpenSearch-specific methods

  /**
   * Gets the index to store the action in.
   * @param {OpenSearchAction} action
   * @returns
   */
  getIndexName(action: OpenSearchAction): string {
    const timestamp = new Date(action.timestamp);

    const year = timestamp.getUTCFullYear().toString();
    let month = (timestamp.getUTCMonth() + 1).toString();
    if (month.length === 1) {
      month = `0${month}`;
    }

    return this._indexPattern
      .replace(/\{companyId\}/g, action.companyId || "")
      .replace(/\{year\}/g, year)
      .replace(/\{month\}/g, month);
  }

  /**
   * Gets the index to store the action in.
   * @param {OpenSearchAction} action
   * @returns
   */
  getIndexNameRange({
    companyId,
    start,
    end,
  }: {
    companyId: string;
    start?: string;
    end?: string;
  }): string {
    let startDate: DateTime;
    let endDate: DateTime;

    if (start) {
      startDate = DateTime.fromISO(start, {
        zone: "utc",
      });
    } else {
      // default to (this._defaultStartMonthsAgo=6) months ago
      startDate = DateTime.fromObject({}, { zone: "utc" }).minus({
        months: this._defaultStartMonthsAgo,
      });
    }
    if (end) {
      endDate = DateTime.fromISO(end, {
        zone: "utc",
      });
    } else {
      endDate = DateTime.fromObject({}, { zone: "utc" });
    }

    return Interval.fromDateTimes(startDate, endDate)
      .splitBy({ month: 1 })
      .map((d) => {
        if (d.end) {
          return `${this._indexPattern
            .replace(/\{companyId\}/g, companyId)
            .replace(/\{year\}/g, d.end.toFormat("yyyy"))
            .replace(/\{month\}/g, d.end.toFormat("LL"))}`; // append * in case index doesn't exist
        }
      })
      .join(",");
  }

  /**
   * Creates the action index dynamic template
   * @returns {Promise<void>} nothing
   */
  async createIndexTemplates(): Promise<void> {
    if (!this._client) {
      return;
    }

    await new Promise(async (resolve) => {
      this._client.indices
        .putIndexTemplate({
          name: this._indexTemplateName,
          body: {
            index_patterns: [this._indexTemplatePattern],
            template: {
              settings: {
                index: {
                  number_of_shards: this._indexTemplateNumShards,
                  number_of_replicas: this._indexTemplateNumReplicas,
                },
              },
              mappings: {
                properties: INDEX_MAPPING,
              },
            },
          },
        })
        .then((template) => {
          this.logger.info(
            `putIndexTemplate success – index template created!`
          );

          resolve(template);
        })
        .catch((err) => {
          this.logger.error(
            `putIndexTemplate error: ${err.statusCode} ${err.name} ${
              err.message
            } ${JSON.stringify(err.body)}`
          );

          // don't throw an error
          resolve(null);
        });
    });
  }

  /**
   * Creates the action index dynamic template, if it doesn't exist already or doesn't match
   * @returns {Promise<void>} nothing
   */
  async upsertIndexTemplates(): Promise<void> {
    if (!this._client) {
      return;
    }

    const template = await new Promise(async (resolve) => {
      await this._client.indices
        .getIndexTemplate({
          name: this._indexTemplateName,
        })
        .then((result: any) => {
          const template =
            result?.body?.index_templates?.[0]?.index_template?.template
              ?.mappings?.properties; // LOL

          if (template) {
            if (deepCompareObjects(template, INDEX_MAPPING)) {
              this.logger.debug(
                "getIndexTemplate already exists & matches mapping"
              );
            } else {
              this.logger.debug(
                `getIndexTemplate already exists but does not match: ${JSON.stringify(
                  template
                )}`
              );

              return resolve(null);
            }
          }

          resolve(template);
        })
        .catch((err) => {
          this.logger.info(`getIndexTemplate does not exist; creating now`);

          // don't throw an error
          resolve(null);
        });
    });

    if (template) {
      return;
    }

    await this.createIndexTemplates();

    return;
  }

  /**
   * Updates one existing action index mapping, if necessary
   * @returns {Promise<void>} nothing
   */
  async updateIndexMapping(index: string): Promise<void> {
    if (!this._client) {
      return;
    }

    const matches = await new Promise(async (resolve) => {
      await this._client.indices
        .get({
          index,
        })
        .then((result: any) => {
          const mapping = result?.body?.[index]?.mappings?.properties;

          if (mapping) {
            if (deepCompareObjects(mapping, INDEX_MAPPING)) {
              this.logger.debug(
                `updateIndexMapping(${index}) already exists & matches mapping`
              );
            } else {
              this.logger.debug(
                `updateIndexMapping(${index}) already exists but does not match: ${JSON.stringify(
                  mapping
                )}`
              );

              return resolve(null);
            }
          }

          resolve(mapping);
        })
        .catch((err) => {
          this.logger.error(
            `updateIndexMapping error: ${err.statusCode} ${err.name} ${
              err.message
            } ${JSON.stringify(err.body)}`
          );

          // don't throw an error
          resolve(null);
        });
    });

    if (!matches) {
      // put mapping
      await new Promise(async (resolve) => {
        await this._client.indices
          .putMapping({
            index,
            body: { properties: INDEX_MAPPING },
          })
          .then((result: any) => {
            this.logger.info(
              `updateIndexMapping(${index}) mapping updated to match template`
            );

            resolve(result);
          })
          .catch((err) => {
            this.logger.error(
              `updateIndexMapping(${index}) error: ${err.statusCode} ${
                err.name
              } ${err.message} ${JSON.stringify(err.body)}`
            );

            // don't throw an error
            resolve(null);
          });
      });
    }
  }

  /**
   * Updates any existing action index mappings, if necessary
   * @returns {Promise<void>} nothing
   */
  async updateIndexMappings(): Promise<void> {
    if (!this._client) {
      return;
    }

    const indices = (await new Promise(async (resolve) => {
      await this._client.cat
        .indices({ index: this._indexTemplatePattern, format: "json" })
        .then((result: any) => {
          this.logger.debug(
            `updateIndexMappings found ${result?.body?.length} indices`
          );

          resolve(result?.body?.map((index: any) => index.index));
        })
        .catch((err) => {
          this.logger.error(
            `updateIndexMappings error: ${err.statusCode} ${err.name} ${
              err.message
            } ${JSON.stringify(err.body)}`
          );

          // don't throw an error
          resolve([]);
        });
    })) as string[];

    if (indices?.length) {
      await Promise.all(indices.map((index) => this.updateIndexMapping(index)));
    }
  }

  /**
   * Returns an array of OpenSearch queries for a FindMany call
   * @param options
   * @param filters
   * @returns
   */
  buildFindManyQuery(
    options: FindActionOptions,
    filters: FindActionFilters
  ): any[] {
    // instantiate companyId and date range filters
    // (defaulting date range to {now - this._defaultStartMonthsAgo} to now)
    const must: any = [
      {
        term: {
          companyId: filters.companyId,
        },
      },
      {
        range: {
          timestamp: {
            gte: filters.start
              ? DateTime.fromISO(filters.start, {
                  zone: "utc",
                }).toISO()
              : DateTime.fromObject({}, { zone: "utc" })
                  .minus({ months: this._defaultStartMonthsAgo })
                  .toISO(),
            lt: filters.end
              ? DateTime.fromISO(filters.end, {
                  zone: "utc",
                }).toISO()
              : DateTime.fromObject({}, { zone: "utc" }).toISO(),
          },
        },
      },
    ];

    // add other filters
    ["id", "clientId", "app", "environment", "sessionId", "traceIds"].forEach(
      (key) => {
        if (filters[key as keyof typeof filters]) {
          must.push({
            terms: {
              [key]: Array.isArray(filters[key as keyof typeof filters])
                ? filters[key as keyof typeof filters]
                : [filters[key as keyof typeof filters]],
            },
          });
        }
      }
    );

    // Sample framework query:
    // { framework: [{ name: 'apollo' }, { name: 'express', version: '5.0.0' }] }
    if (filters.framework) {
      const frameworks = Array.isArray(filters.framework)
        ? filters.framework
        : [filters.framework];

      const frameworkShould: any = [];

      // OR all the framework queries together
      frameworks.forEach((framework) => {
        const frameworkMust: any = [];
        ["name", "version"].forEach((key) => {
          if (framework?.[key as keyof typeof framework]) {
            frameworkMust.push({
              term: {
                [`framework.${key}`]:
                  framework?.[key as keyof typeof framework],
              },
            });
          }
        });
        if (frameworkMust.length === 1) {
          frameworkShould.push(frameworkMust[0]);
        } else if (frameworkMust.length) {
          frameworkShould.push({
            bool: {
              must: frameworkMust,
            },
          });
        }
      });

      if (frameworkShould.length === 1) {
        must.push(frameworkShould[0]);
      } else if (frameworkShould.length) {
        must.push({
          bool: {
            should: frameworkShould,
          },
        });
      }
    }

    // Sample action query:
    // {
    //   action: [
    //     { type: 'HTTP', verb: 'POST', object: '/v1/transactions' },
    //     { type: 'GRAPHQL', verb: 'mutation', object: 'CreateTransaction' }
    //   ]
    // }
    if (filters.action) {
      const actions = Array.isArray(filters.action)
        ? filters.action
        : [filters.action];

      const actionShould: any = [];

      // OR all the action queries together
      actions.forEach((action) => {
        const actionMust: any = [];
        ["id", "type", "verb", "object"].forEach((key) => {
          if (action?.[key as keyof typeof action]) {
            actionMust.push({
              term: {
                [`action.${key === "object" ? "object.keyword" : key}`]:
                  action?.[key as keyof typeof action],
              },
            });
          }
        });
        if (actionMust.length === 1) {
          actionShould.push(actionMust[0]);
        } else if (actionMust.length) {
          actionShould.push({
            bool: {
              must: actionMust,
            },
          });
        }
      });

      if (actionShould.length === 1) {
        must.push(actionShould[0]);
      } else if (actionShould.length) {
        must.push({
          bool: {
            should: actionShould,
          },
        });
      }
    }

    // Sample agents query:
    // {
    //   agents: [
    //     { type: 'USER', id: 'user_123' },
    //     { type: 'USER', meta: { clerkUserId: 'clk_user_456' } }
    //   ]
    // }
    if (filters.agents) {
      const agents = Array.isArray(filters.agents)
        ? filters.agents
        : [filters.agents];

      const agentShould: any = [];

      // OR all the agent queries together
      agents.forEach((agent) => {
        const agentMust: any = [];
        ["id", "type", "name"].forEach((key) => {
          if (agent?.[key as keyof typeof agent]) {
            agentMust.push({
              term: {
                [`agents.${key}`]: agent?.[key as keyof typeof agent],
              },
            });
          }
        });

        if (agent.meta && Object.keys(agent.meta).length) {
          const agentMetaMust: any = [];
          Object.keys(agent.meta).forEach((key) => {
            agentMetaMust.push({
              term: {
                "agents.meta.key": key,
              },
            });
            agentMetaMust.push({
              term: {
                "agents.meta.value.keyword":
                  agent.meta?.[key as keyof typeof agent.meta],
              },
            });
          });
          if (agentMetaMust.length) {
            agentMust.push({
              nested: {
                path: "agents.meta",
                query:
                  agentMetaMust.length === 1
                    ? agentMetaMust[0]
                    : {
                        bool: { must: agentMetaMust },
                      },
              },
            });
          }
        }

        if (agentMust.length === 1) {
          agentShould.push(agentMust[0]);
        } else if (agentMust.length) {
          agentShould.push({
            bool: {
              must: agentMust,
            },
          });
        }
      });

      if (agentShould.length) {
        must.push({
          nested: {
            path: "agents",
            query:
              agentShould.length === 1
                ? agentShould[0]
                : {
                    bool: {
                      should: agentShould,
                    },
                  },
          },
        });
      }
    }

    // Sample targets query:
    // {
    //   targets: [
    //     { type: 'transaction', id: 'transaction_123' },
    //     { type: 'user', meta: { clerkUserId: 'clk_user_456' } }
    //   ]
    // }
    if (filters.targets) {
      const targets = Array.isArray(filters.targets)
        ? filters.targets
        : [filters.targets];

      const targetShould: any = [];

      // OR all the target queries together
      targets.forEach((target) => {
        const targetMust: any = [];
        ["id", "type", "name"].forEach((key) => {
          if (target?.[key as keyof typeof target]) {
            targetMust.push({
              term: {
                [`targets.${key}`]: target?.[key as keyof typeof target],
              },
            });
          }
        });

        if (target.meta && Object.keys(target.meta).length) {
          const targetMetaMust: any = [];
          Object.keys(target.meta).forEach((key) => {
            targetMetaMust.push({
              term: {
                "targets.meta.key": key,
              },
            });
            targetMetaMust.push({
              term: {
                "targets.meta.value.keyword":
                  target.meta?.[key as keyof typeof target.meta],
              },
            });
          });
          if (targetMetaMust.length) {
            targetMust.push({
              nested: {
                path: "targets.meta",
                query:
                  targetMetaMust.length === 1
                    ? targetMetaMust[0]
                    : {
                        bool: { must: targetMetaMust },
                      },
              },
            });
          }
        }

        if (targetMust.length === 1) {
          targetShould.push(targetMust[0]);
        } else if (targetMust.length) {
          targetShould.push({
            bool: {
              must: targetMust,
            },
          });
        }
      });

      if (targetShould.length) {
        must.push({
          nested: {
            path: "targets",
            query:
              targetShould.length === 1
                ? targetShould[0]
                : {
                    bool: {
                      should: targetShould,
                    },
                  },
          },
        });
      }
    }

    if (filters.request) {
      const requests = Array.isArray(filters.request)
        ? filters.request
        : [filters.request];

      const requestShould: any = [];

      // OR all the request queries together
      requests.forEach((request) => {
        const requestMust: any = [];
        Object.keys(request).forEach((key) => {
          if (request?.[key] && typeof request?.[key] === "object") {
            // it's a parent
            Object.keys(request?.[key]).forEach((innerKey) => {
              requestMust.push({
                nested: {
                  path: "request",
                  query: {
                    bool: {
                      must: [
                        {
                          term: { "request.key": innerKey },
                        },
                        {
                          term: { "request.parent": key },
                        },
                        {
                          term: {
                            "request.value.keyword": (
                              request?.[key as keyof typeof request] as any
                            )?.[innerKey],
                          },
                        },
                      ],
                    },
                  },
                },
              });
            });
          } else {
            requestMust.push({
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: { "request.key": key },
                      },
                      {
                        term: {
                          "request.value.keyword":
                            request?.[key as keyof typeof request],
                        },
                      },
                    ],
                  },
                },
              },
            });
          }
        });

        if (requestMust.length === 1) {
          requestShould.push(requestMust[0]);
        } else if (requestMust.length) {
          requestShould.push({
            bool: {
              must: requestMust,
            },
          });
        }
      });

      if (requestShould.length) {
        must.push(
          requestShould.length === 1
            ? requestShould[0]
            : {
                bool: {
                  should: requestShould,
                },
              }
        );
      }
    }

    if (filters.response) {
      const responseMust: any = [];
      if (filters.response.status) {
        responseMust.push(
          Array.isArray(filters.response.status)
            ? {
                terms: {
                  "response.status": filters.response.status,
                },
              }
            : {
                term: {
                  "response.status": filters.response.status,
                },
              }
        );
      }

      if (filters.response.time?.gte || filters.response.time?.lt) {
        responseMust.push({
          range: {
            "response.time": {
              ...(filters.response.time?.gte
                ? {
                    gte: filters.response.time?.gte,
                  }
                : {}),
              ...(filters.response.time?.lt
                ? {
                    lt: filters.response.time?.lt,
                  }
                : {}),
            },
          },
        });
      }

      if (filters.response.body) {
        const responseBodyShould: any[] = [];

        const responseBody = Array.isArray(filters.response.body)
          ? filters.response.body
          : [filters.response.body];

        responseBody.forEach((body) => {
          const responseBodyMust: any[] = [];

          Object.keys(body).forEach((key) => {
            responseBodyMust.push({
              term: {
                "response.body.key": key,
              },
            });

            responseBodyMust.push({
              term: {
                "response.body.value.keyword": body[key as keyof typeof body],
              },
            });
          });

          if (responseBodyMust.length) {
            responseBodyShould.push({
              nested: {
                path: "response.body",
                query:
                  responseBodyMust.length === 1
                    ? responseBodyMust[0]
                    : { bool: { must: responseBodyMust } },
              },
            });
          }
        });

        if (responseBodyShould.length) {
          responseMust.push(
            responseBodyShould.length === 1
              ? responseBodyShould[0]
              : {
                  bool: {
                    should: responseBodyShould,
                  },
                }
          );
        }
      }

      if (filters.response.headers) {
        const responseHeadersShould: any[] = [];

        const responseHeaders = Array.isArray(filters.response.headers)
          ? filters.response.headers
          : [filters.response.headers];

        responseHeaders.forEach((headers) => {
          const responseHeadersMust: any[] = [];

          Object.keys(headers).forEach((key) => {
            responseHeadersMust.push({
              term: {
                "response.headers.key": key,
              },
            });

            responseHeadersMust.push({
              term: {
                "response.headers.value.keyword":
                  headers[key as keyof typeof headers],
              },
            });
          });

          if (responseHeadersMust.length) {
            responseHeadersShould.push({
              nested: {
                path: "response.headers",
                query:
                  responseHeadersMust.length === 1
                    ? responseHeadersMust[0]
                    : { bool: { must: responseHeadersMust } },
              },
            });
          }
        });

        if (responseHeadersShould.length) {
          responseMust.push(
            responseHeadersShould.length === 1
              ? responseHeadersShould[0]
              : {
                  bool: {
                    should: responseHeadersShould,
                  },
                }
          );
        }
      }

      if (responseMust.length) {
        must.push(
          responseMust.length === 1
            ? responseMust[0]
            : {
                bool: { must: responseMust },
              }
        );
      }
    }

    if (filters.changes) {
      const changes = Array.isArray(filters.changes)
        ? filters.changes
        : [filters.changes];

      const changesShould: any = [];

      // OR all the change queries together
      changes.forEach((change) => {
        const changeMust: any = [];
        ["model", "operation", "id", "path", "before", "after"].forEach(
          (key) => {
            if (change?.[key as keyof typeof change]) {
              changeMust.push({
                term: {
                  [`changes.${
                    ["path", "before", "after"].includes(
                      key as keyof typeof change
                    )
                      ? `${key}.keyword`
                      : key
                  }`]: change?.[key as keyof typeof change],
                },
              });
            }
          }
        );

        if (change.meta && Object.keys(change.meta).length) {
          const changeMetaMust: any = [];
          Object.keys(change.meta).forEach((key) => {
            changeMetaMust.push({
              term: {
                "changes.meta.key": key,
              },
            });
            changeMetaMust.push({
              term: {
                "changes.meta.value.keyword":
                  change.meta?.[key as keyof typeof change.meta],
              },
            });
          });
          if (changeMetaMust.length) {
            changeMust.push({
              nested: {
                path: "changes.meta",
                query:
                  changeMetaMust.length === 1
                    ? changeMetaMust[0]
                    : {
                        bool: { must: changeMetaMust },
                      },
              },
            });
          }
        }

        if (changeMust.length === 1) {
          changesShould.push(changeMust[0]);
        } else if (changeMust.length) {
          changesShould.push({
            bool: {
              must: changeMust,
            },
          });
        }
      });

      if (changesShould.length) {
        must.push({
          nested: {
            path: "changes",
            query:
              changesShould.length === 1
                ? changesShould[0]
                : {
                    bool: {
                      should: changesShould,
                    },
                  },
          },
        });
      }
    }

    if (filters.meta) {
      const metas = Array.isArray(filters.meta) ? filters.meta : [filters.meta];

      const metaShould: any = [];

      // OR all the target queries together
      metas.forEach((meta) => {
        const metaMust: any[] = [];

        Object.keys(meta).forEach((key) => {
          metaMust.push({
            nested: {
              path: "meta",
              query: {
                bool: {
                  must: [
                    {
                      term: {
                        "meta.key": key,
                      },
                    },
                    {
                      term: {
                        "meta.value.keyword": meta?.[key as keyof typeof meta],
                      },
                    },
                  ],
                },
              },
            },
          });
        });

        if (metaMust.length) {
          metaShould.push(
            metaMust.length === 1
              ? metaMust[0]
              : {
                  bool: { must: metaMust },
                }
          );
        }
      });

      if (metaShould.length) {
        must.push(
          metaShould.length === 1
            ? metaShould[0]
            : {
                bool: {
                  should: metaShould,
                },
              }
        );
      }
    }

    return must;
  }
}

export { OpenSearchEngine };
