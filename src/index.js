import Model, {identities} from './model';
// import ModelList from './modellist';
import Factory from './factory';
import Registry from './registry';
import ModelRegistry from './modelregistry';
/**
 * Mozy classes
 */
export { Model };
// export { ModelList };
export { Factory };
export { Registry };
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
export const modelRegistry = new ModelRegistry('uuid', modelFactory);
/**
 * Mozy export
 */
export default {
    Model,
    // ModelList,
    Factory,
    Registry,
    ModelRegistry,
    modelIdentities,
    modelFactory,
    modelRegistry
};
