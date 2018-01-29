import Model, {identities} from './model';
import Factory from './factory';
import ModelRegistry from './modelregistry';
/**
 * Mozy classes
 */
export { Model };
export { Factory };
export { ModelRegistry };
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
export const modelRegistry = new ModelRegistry(modelFactory);
/**
 * Mozy export
 */
export default {
  Model,
  Factory,
  ModelRegistry,
  modelIdentities,
  modelFactory,
  modelRegistry
};
