import isObject from 'lodash.isobject';
import isFunction from 'lodash.isfunction';
import Registry, {InvalidRegistryKeyError} from './registry';
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
        return [key, null];
    }
    /**
     * Get existing model in registry or create new.
     * @param {Object} data JSON serializable object.
     * @param {Function} Constructor Make new model of type Constructor.
     * @return {Model} New or registered model.
     */
    getModel(data, Constructor) {
        // Get registered key and model
        let [key, model] = this.getEntryForData(data);
        // Don't allow getting registered models with different data object
        if (model && model.getModelData() !== data) {
            throw new Error('Data object mismatch.');
        }
        // No model found, create new model and register
        if (!model) {
            // New model
            model = this.newInstanceFor(data, Constructor);
            // Get key in data
            key = this.getValidKeyIn(data);
            // Register
            this.set(key, model);
        }
        // Return existing or new model
        return model;
    }
    /**
     * Create new model instance using factory or Constructor.
     * @param {Object} data JSON serializable object.
     * @param {Function} Constructor Make new model of type Constructor.
     * @return {Model} New Model instance.
     */
    newInstanceFor(data, Constructor, constructorArgs) {
        // Constructor specified
        if (Constructor) {
            constructorArgs = constructorArgs || [data];
            return new Constructor(...constructorArgs);
        }
        if (this.factory) {
            // If mozy.Factory
            if (this.factory instanceof Factory) {
                return this.factory.newInstanceFor(data, constructorArgs);
            // Assume function
            } else {
                const factoryFunction = this.factory;
                return factoryFunction.apply(this, constructorArgs || [data]);
            }
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
