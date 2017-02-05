import Model, * as model from './model';
import ModelList from './modellist';
import Factory from './factory';
import Registry, * as registry from './registry';
import ModelRegistry from './modelregistry';
/**
 * Mozy classes
 */
export { Model };
export { ModelList };
export { Factory };
export { Registry };
export { ModelRegistry };
/**
 * Model factory
 */
export const modelFactory = new Factory(model.identities);
/**
 * Model registry
 */
export const modelRegistry = new ModelRegistry('uuid', modelFactory);
/**
 * Mozy export
 */
export default {
    Model,
    ModelList,
    Factory,
    Registry,
    ModelRegistry,
    model,
    registry,
    modelIdentities: model.identities,
    modelFactory,
    modelRegistry
};
