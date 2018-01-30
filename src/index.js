import Model, {identities} from './model';
import Factory from './factory';
import Registry from './registry';
/**
 * Mozy classes
 */
export { Model };
export { Factory };
export { Registry };
/**
 * Model identities
 */
export const modelIdentities = identities;
/**
 * Model factory
 */
export const modelFactory = new Factory(modelIdentities);
/**
 * Model registry
 */
export const modelRegistry = new Registry(modelFactory);
/**
 * Mozy export
 */
export default {
  Model,
  Factory,
  Registry,
  modelIdentities,
  modelFactory,
  modelRegistry
};
