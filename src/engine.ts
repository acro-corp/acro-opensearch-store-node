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

    const meta = transformArrayToObject(action.meta);

    return {
      ...action,
      agents,
      targets,
      request,
      response,
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

      if (filters.framework) {
        const frameworkMust: any = [];
        ["name", "version"].forEach((key) => {
          if (filters.framework?.[key as keyof typeof filters.framework]) {
            frameworkMust.push({
              terms: {
                [`framework.${key}`]: Array.isArray(
                  filters.framework?.[key as keyof typeof filters.framework]
                )
                  ? filters.framework?.[key as keyof typeof filters.framework]
                  : [
                      filters.framework?.[
                        key as keyof typeof filters.framework
                      ],
                    ],
              },
            });
          }
        });
        if (frameworkMust.length) {
          must.push({
            nested: {
              path: "framework",
              query: { bool: { must: frameworkMust } },
            },
          });
        }
      }

      if (filters.action) {
        const actionMust: any = [];
        ["id", "type", "verb", "object"].forEach((key) => {
          if (filters.action?.[key as keyof typeof filters.action]) {
            actionMust.push({
              terms: {
                [`action.${key}`]: Array.isArray(
                  filters.action?.[key as keyof typeof filters.action]
                )
                  ? filters.action?.[key as keyof typeof filters.action]
                  : [filters.action?.[key as keyof typeof filters.action]],
              },
            });
          }
        });
        if (actionMust.length) {
          must.push({
            nested: {
              path: "action",
              query: { bool: { must: actionMust } },
            },
          });
        }
      }

      if (filters.agents) {
        const agentsMust: any = [];
        ["id", "type", "name"].forEach((key) => {
          if (filters.agents?.[key as keyof typeof filters.agents]) {
            agentsMust.push({
              terms: {
                [`agents.${key}`]: Array.isArray(
                  filters.agents?.[key as keyof typeof filters.agents]
                )
                  ? filters.agents?.[key as keyof typeof filters.agents]
                  : [filters.agents?.[key as keyof typeof filters.agents]],
              },
            });
          }
        });
        if (filters.agents.meta) {
          const agentsMetaMust: any = [];
          Object.keys(filters.agents.meta).forEach((key) => {
            agentsMetaMust.push({
              terms: {
                [`agents.meta.${key}`]: Array.isArray(
                  filters.agents?.meta?.[
                    key as keyof typeof filters.agents.meta
                  ]
                )
                  ? filters.agents?.meta?.[
                      key as keyof typeof filters.agents.meta
                    ]
                  : [
                      filters.agents?.meta?.[
                        key as keyof typeof filters.agents.meta
                      ],
                    ],
              },
            });
          });
          if (agentsMetaMust.length) {
            agentsMust.push({
              nested: {
                path: "agents.meta",
                query: { bool: { must: agentsMetaMust } },
              },
            });
          }
        }
        if (agentsMust.length) {
          must.push({
            nested: {
              path: "agents",
              query: { bool: { must: agentsMust } },
            },
          });
        }
      }

      if (filters.targets) {
        const targetsMust: any = [];
        ["id", "type", "name"].forEach((key) => {
          if (filters.targets?.[key as keyof typeof filters.targets]) {
            targetsMust.push({
              terms: {
                [`targets.${key}`]: Array.isArray(
                  filters.targets?.[key as keyof typeof filters.targets]
                )
                  ? filters.targets?.[key as keyof typeof filters.targets]
                  : [filters.targets?.[key as keyof typeof filters.targets]],
              },
            });
          }
        });
        if (filters.targets.meta) {
          const targetsMetaMust: any = [];
          Object.keys(filters.targets.meta).forEach((key) => {
            targetsMetaMust.push({
              terms: {
                [`targets.meta.${key}`]: Array.isArray(
                  filters.targets?.meta?.[
                    key as keyof typeof filters.targets.meta
                  ]
                )
                  ? filters.targets?.meta?.[
                      key as keyof typeof filters.targets.meta
                    ]
                  : [
                      filters.targets?.meta?.[
                        key as keyof typeof filters.targets.meta
                      ],
                    ],
              },
            });
          });
          if (targetsMetaMust.length) {
            targetsMust.push({
              nested: {
                path: "targets.meta",
                query: { bool: { must: targetsMetaMust } },
              },
            });
          }
        }
        if (targetsMust.length) {
          must.push({
            nested: {
              path: "targets",
              query: { bool: { must: targetsMust } },
            },
          });
        }
      }

      if (filters.request) {
        const requestMust: any = [];
        Object.keys(filters.request).forEach((key) => {
          if (
            filters.request?.[key] &&
            typeof filters.request?.[key] === "object"
          ) {
            // it's a parent
            Object.keys(filters.request?.[key]).forEach((innerKey) => {
              requestMust.push({
                bool: {
                  must: [
                    {
                      term: { innerKey },
                    },
                    {
                      parent: { key },
                    },
                    {
                      terms: {
                        value: Array.isArray(
                          (
                            filters.request?.[
                              key as keyof typeof filters.request
                            ] as any
                          )?.[innerKey]
                        )
                          ? (
                              filters.request?.[
                                key as keyof typeof filters.request
                              ] as any
                            )?.[innerKey]
                          : [
                              (
                                filters.request?.[
                                  key as keyof typeof filters.request
                                ] as any
                              )?.[innerKey],
                            ],
                      },
                    },
                  ],
                },
              });
            });
          } else {
            requestMust.push({
              bool: {
                must: [
                  {
                    term: { key },
                  },
                  {
                    terms: {
                      value: Array.isArray(
                        filters.request?.[key as keyof typeof filters.request]
                      )
                        ? filters.request?.[key as keyof typeof filters.request]
                        : [
                            filters.request?.[
                              key as keyof typeof filters.request
                            ],
                          ],
                    },
                  },
                ],
              },
            });
          }
        });
        if (requestMust.length) {
          must.push({
            nested: {
              path: "request",
              query: { bool: { must: requestMust } },
            },
          });
        }
      }

      if (filters.response) {
        const responseMust: any = [];
        if (filters.response.status) {
          responseMust.push({
            terms: {
              "response.status": Array.isArray(filters.response.status)
                ? filters.response.status
                : [filters.response.status],
            },
          });
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
          const responseBodyMust: any = [];
          Object.keys(filters.response.body).forEach((key) => {
            responseBodyMust.push({
              terms: {
                [`response.body.${key}`]: Array.isArray(
                  filters.response?.body?.[
                    key as keyof typeof filters.response.body
                  ]
                )
                  ? filters.response?.body?.[
                      key as keyof typeof filters.response.body
                    ]
                  : [
                      filters.response?.body?.[
                        key as keyof typeof filters.response.body
                      ],
                    ],
              },
            });
          });
          if (responseBodyMust.length) {
            responseMust.push({
              nested: {
                path: "response.body",
                query: { bool: { must: responseBodyMust } },
              },
            });
          }
        }
        if (filters.response.headers) {
          const responseHeadersMust: any = [];
          Object.keys(filters.response.headers).forEach((key) => {
            responseHeadersMust.push({
              terms: {
                [`response.headers.${key}`]: Array.isArray(
                  filters.response?.headers?.[
                    key as keyof typeof filters.response.headers
                  ]
                )
                  ? filters.response?.headers?.[
                      key as keyof typeof filters.response.headers
                    ]
                  : [
                      filters.response?.headers?.[
                        key as keyof typeof filters.response.headers
                      ],
                    ],
              },
            });
          });
          if (responseHeadersMust.length) {
            responseMust.push({
              nested: {
                path: "response.headers",
                query: { bool: { must: responseHeadersMust } },
              },
            });
          }
        }
        if (responseMust.length) {
          must.push({
            nested: {
              path: "response",
              query: { bool: { must: responseMust } },
            },
          });
        }
      }

      if (filters.meta) {
        const metaMust: any = [];
        Object.keys(filters.meta).forEach((key) => {
          metaMust.push({
            terms: {
              [`meta.${key}`]: Array.isArray(
                filters.meta?.[key as keyof typeof filters.meta]
              )
                ? filters.meta?.[key as keyof typeof filters.meta]
                : [filters.meta?.[key as keyof typeof filters.meta]],
            },
          });
        });
        if (metaMust.length) {
          must.push({
            nested: {
              path: "meta",
              query: { bool: { must: metaMust } },
            },
          });
        }
      }

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
}

export { OpenSearchEngine };
