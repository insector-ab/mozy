/**
 * @typedef {new (...args: any[]) => Model} ModelConstructor
 * @typedef {import('./factory').default} FactoryClass
 * @typedef {import('./registry').default} RegistryClass
 */
import Model, { identities } from './model.js';
import Factory from './factory.js';
import Registry, {
  ALLOW_OVERRIDES,
  DONT_ALLOW_OVERRIDES,
  InvalidRegistryKeyError
} from './registry.js';
/**
 * Mozy classes
 */
export { Model };
export { Factory };
export { Registry };
/**
 * Registry constants and errors
 */
export { ALLOW_OVERRIDES };
export { DONT_ALLOW_OVERRIDES };
export { InvalidRegistryKeyError };
/**
 * Model identities
 * @type {Map<string, ModelConstructor>}
 */
export const modelIdentities = identities;
/**
 * Model factory
 * @type {FactoryClass}
 */
export const modelFactory = new Factory(modelIdentities);
/**
 * Model registry
 * @type {RegistryClass}
 */
export const modelRegistry = new Registry(modelFactory);
/**
 * Mozy export
 */
/**
 * @type {{
 *  Model: typeof Model,
 *  Factory: typeof Factory,
 *  Registry: typeof Registry,
 *  ALLOW_OVERRIDES: typeof ALLOW_OVERRIDES,
 *  DONT_ALLOW_OVERRIDES: typeof DONT_ALLOW_OVERRIDES,
 *  InvalidRegistryKeyError: typeof InvalidRegistryKeyError,
 *  modelIdentities: typeof modelIdentities,
 *  modelFactory: typeof modelFactory,
 *  modelRegistry: typeof modelRegistry
 * }}
 */
export default {
  Model,
  Factory,
  Registry,
  ALLOW_OVERRIDES,
  DONT_ALLOW_OVERRIDES,
  InvalidRegistryKeyError,
  modelIdentities,
  modelFactory,
  modelRegistry
};
