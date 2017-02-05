import Model from './src/model';
import Factory from './src/factory';
import Registry from './src/registry';
import ModelRegistry from './src/modelregistry';
/**
 * Mozy classes
 */
export { Model };
export { Factory };
export { Registry };
export { ModelRegistry };
/**
 * Model identities
 */
export const identities = new Map();
identities.set(Model.identity, Model);
/**
 * Model factory
 */
export const factory = new Factory(identities);
/**
 * Model registry
 */
export const registry = new ModelRegistry('uuid', factory);
/**
 * Mozy export
 */
export default {
    Model,
    Factory,
    Registry,
    ModelRegistry,
    identities,
    factory,
    registry
};
