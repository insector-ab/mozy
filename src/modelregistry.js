import isObject from 'lodash.isobject';
import isFunction from 'lodash.isfunction';
import Registry, {InvalidRegistryKeyError} from './registry';
import Model from './model';
import ModelList, {getModelListHandler, getRelationListHandler} from './modellist';
import Factory from './factory';

/**
 * Default keyValidator for ModelRegistry.
 * @param {*} key The key to check.
 * @return {boolean} True if valid.
 */
function defaultKeyValidator(key) {
    return typeof key === 'string';
}

/**
 * ModelRegistry
 */
export default class ModelRegistry extends Registry {
    /**
     * ModelRegistry.constructor
     * @param {String} keyAttr The attribute from which to get the registry key for models.
     * @param {Factory|Function} factory Model factory.
     * @param {Map} map @see Registry constructor.
     * @param {boolean} allowOverrides @see Registry constructor.
     * @param {Function} keyValidator @see Registry constructor.
     */
    constructor(keyAttr, factory, map, allowOverrides, keyValidator) {
        if (!factory) {
            throw new TypeError('Argument factory required.');
        }
        // Super
        super(map, allowOverrides, keyValidator || defaultKeyValidator);
        // key to register
        this._keyAttr = keyAttr || 'uuid';
        // Factory for creating instances.
        this._factory = factory;
    }
    /**
     * The attribute from which to get the registry key for models.
     * E.g. "id", uuid" ..
     * @return {String} Name of attribute.
     */
    get keyAttr() {
        return this._keyAttr;
    }
    set keyAttr(value) {
        this._keyAttr = value;
        return value;
    }
    /**
     * Model factory.
     * @return {Factory|Function} Instance of Factory, or factory function
     */
    get factory() {
        return this._factory;
    }
    set factory(value) {
        this._factory = value;
    }
    /**
     * Validate key and value. If not valid throw error.
     * @param {*} key The key to Validate.
     * @param {*} value Tha value to validate.
     * @return {ModelRegistry} The ModelRegistry object.
     */
    validate(key, value) {
        super.validate(key, value);
        // value must be instance of Model or ModelList
        if (!(value instanceof Model || value instanceof ModelList)) {
            throw new TypeError('Registry value must be instance of Model or ModelList.');
        }
        return this;
    }
    /**
     * Get valid key from data object. Throw error if not valid.
     * @param {Object} data JSON serializable object.
     * @return {String} Key to register.
     */
    getValidKeyIn(data) {
        // Require data
        if (!isObject(data)) {
            throw new TypeError('Argument data must be Object');
        }
        const keyAttr = this.keyAttr;
        let key;
        // keyAttr is function?
        if (isFunction(keyAttr)) {
            key = keyAttr.call(this, data);
        // data[keyAttr]
        } else {
            key = data[keyAttr];
        }
        // Require valid
        if (!this.isValidKey(key)) {
            throw new InvalidRegistryKeyError(key, data);
        }
        // Return valid key
        return key;
    }
    /**
     * Get existing registration, key and model.
     * @param {Object} data JSON serializable object.
     * @return {Array} Registration entry [key, value].
     */
    getEntryForData(data) {
        // Key
        const key = this.getValidKeyIn(data);
        // If key is registered, return with model.
        if (this.has(key)) {
            return [key, this.get(key)];
        }
        // return without model
        return [key, undefined];
    }
    /**
     * Get existing model in registry or create new.
     * @param {Object} data JSON serializable object.
     * @param {Function} Constructor Make new model of type Constructor.
     * @return {Model} New or registered model.
     */
    getModel(data, Constructor) {
        let key, model;
        // If data has valid key, get key and model (if registered)
        if (this.dataHasValidKey(data)) {
            [key, model] = this.getEntryForData(data);
        }
        // Don't allow getting registered models with different data object
        if (model && model.getModelData() !== data) {
            throw new Error('Data object mismatch.');
        }
        // No model found, create new model and register
        if (!model) {
            // New model
            if (Constructor) {
                model = new Constructor(data);
            } else {
                model = this.newInstanceFor(data);
            }
            // Get key in data
            key = this.getValidKeyIn(model.getModelData());
            // Register
            this.set(key, model);
        }
        // Return existing or new model
        return model;
    }
    /**
     * Get existing ModelList in registry or create new.
     * @return {ModelList} New or registered ModelList.
     */
    getModelList(items, key, handler) {
        // Require items
        if (!Array.isArray(items)) {
            throw new TypeError('Argument items must be Array');
        }
        let modelList;
        // Require valid key
        if (!this.isValidKey(key)) {
            throw new InvalidRegistryKeyError(key, items);
        }
        // If registered
        if (this.has(key)) {
            modelList = this.get(key);
        }
        // If different items array in modelList, update.
        if (modelList && modelList.items !== items) {
            modelList.items = items;
        }
        // No modelList found, create new modelList and register
        if (!modelList) {
            // New
            modelList = new ModelList(items, handler || getModelListHandler(this));
            // Register
            this.set(key, modelList);
        }
        // Return existing or new modelList
        return modelList;
    }
    /**
     * Same as getModelList but with default relation list handler.
     * @return {ModelList} New or registered ModelList.
     */
    getRelationList(items, key, keyAttr) {
        const handler = getRelationListHandler(this, keyAttr || this.keyAttr);
        return this.getModelList(items, key, handler);
    }
    /**
     * Create new model instance using factory.
     * @param {Object} data JSON serializable object.
     * @return {Model} New Model instance.
     */
    newInstanceFor(data) {
        // If mozy.Factory
        if (this.factory instanceof Factory) {
            return this.factory.newInstanceFor(data);
        }
        // If Function
        if (isFunction(this.factory)) {
            const factoryFunction = this.factory;
            return factoryFunction.call(this, data);
        }
        // No factory and no Constructor argument.
        throw new Error('Could not create model from data. Missing factory/constructor.');
    }
    /**
     * Register model.
     * @param {Model} model The model instance to register.
     * @return {ModelRegistry} The ModelRegistry object.
     */
    registerModel(model) {
        // Get valid key
        const key = this.getValidKeyIn(model.getModelData());
        // register the model
        return this.set(key, model);
    }
    /**
     * Check if data object has a valid key for registration.
     * @param {Object} data JSON serializable object.
     * @return {boolean} True if valid.
     */
    dataHasValidKey(data) {
        try {
            this.getValidKeyIn(data);
        } catch (err) {
            if (err instanceof InvalidRegistryKeyError) {
                return false;
            }
            throw err;
        }
        return true;
    }
}

// Store multitons
ModelRegistry._instances = new Map();

// Multiton getter
ModelRegistry.get = function(name, ...constructorArgs) {
    // Instance exists?
    if (ModelRegistry._instances.has(name)) {
        return ModelRegistry._instances.get(name);
    }
    // Create new ModelRegistry
    const reg = new ModelRegistry(...constructorArgs);
    // Register
    ModelRegistry._instances.set(name, reg);
    // return
    return reg;
};
