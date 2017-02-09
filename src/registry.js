import ExtendableError from 'es6-error';
import isUndefined from 'lodash.isundefined';
import isFunction from 'lodash.isfunction';

/**
 * Constants
 */
export const ALLOW_OVERRIDES = true;
export const DONT_ALLOW_OVERRIDES = false;

/**
 * Registry
 */
export default class Registry {
    /**
     * Registry.constructor
     * @param {Object|Map|Registry} map Map-like Object to use for registration.
     * @param {boolean} allowOverrides True if override of keys allowed.
     * @param {Function} keyValidator Function that takes key and returns true if valid.
     */
    constructor(map, allowOverrides, keyValidator) {
        // Map/Object to use for registration
        this._map = map || new Map();
        // Proxy needed? If not Map or Registry assume Object.
        if (!(this._map instanceof Map || this._map instanceof Registry)) {
            this._map = getMapObjectProxy(this._map);
        }
        // Allow overrides (default to false)
        this._allowOverrides = allowOverrides;
        this._defaultAllowOverrides = DONT_ALLOW_OVERRIDES;
        // Function for validating keys
        this._keyValidator = keyValidator;
    }
    /**
     * Allow/disallow overriding of keys in registry.
     * @return {boolean} True if allowed.
     */
    get allowOverrides() {
        if (isUndefined(this._allowOverrides)) {
            return this._defaultAllowOverrides;
        }
        return this._allowOverrides;
    }
    set allowOverrides(value) {
        this._allowOverrides = value;
    }
    /**
     * Map.get API
     * @param {*} key The key of the element to return from the Registry.
     * @return {*} The element associated with the specified key or undefined if the key can't be found in the Map object.
     */
    get(key) {
        return this._map.get(key);
    }
    /**
     * Map.set API
     * @param {*} key The key of the element to add to the Registry.
     * @param {*} value The value of the element to add to the Registry.
     * @return {ModelRegistry} The ModelRegistry object.
     */
    set(key, value) {
        // Validate
        this.validate(key, value);
        // register
        this._map.set(key, value);
        // Return
        return this;
    }
    /**
     * Map.has API
     * @param {*} key The key of the element to test for presence in the Registry.
     * @return {boolean} True if exists.
     */
    has(key) {
        return this._map.has(key);
    }
    /**
     * Map.delete API
     * @param {*} key The key of the element to delete from the Registry.
     * @return {boolean} True if key found and deleted.
     */
    delete(key) {
        return this._map.delete(key);
    }
    /**
     * Map.clear API
     */
    clear() {
        this._map.clear();
    }
    /**
     * Same as get(key), but throws error if key not found.
     * @param {*} key The key of the element to return from the Registry.
     * @return {*} The element associated with the specified key.
     */
    require(key) {
        if (!this.has(key)) {
            throw new Error('Key "' + key + '" required but not found.');
        }
        return this.get(key);
    }
    /**
     * Validate key and value. If not valid throw error.
     * @param {*} key The key to Validate.
     * @param {*} value Tha value to validate.
     * @return {ModelRegistry} The ModelRegistry object.
     */
    validate(key, value) {
        if (!this.isValidKey(key)) {
            throw new InvalidRegistryKeyError(key);
        }
        // Allow?
        if (this.has(key) && this.allowOverrides === false) {
            throw new Error(this.constructor.name + ' key "' + key + '" already registered.');
        }
        // Return this
        return this;
    }
    /**
     * Check if key is valid for registration.
     * @param {*} key The key of the element to return from the Registry.
     * @return {boolean} True if valid.
     */
    isValidKey(key) {
        if (isFunction(this._keyValidator)) {
            return this._keyValidator(key);
        }
        // No validation
        return true;
    }
}

/**
 * InvalidRegistryKeyError
 */
export class InvalidRegistryKeyError extends ExtendableError {

    constructor(key, data) {
        let lines = ['Invalid key "' + key + '" for getting instance from registry.'];
        if (data) {
            lines.push('Data: ' + JSON.stringify(data));
        }
        super(lines.join(' '));
    }

}

/**
 * Get a Map proxy object for an Object instance.
 * @param {Object} obj The Object to proxy.
 * @return {Object} Object with basic Map API methods.
 */
function getMapObjectProxy(obj) {
    return {
        get: function(key) {
            return obj[key];
        },
        set: function(key, value) {
            obj[key] = value;
        },
        has: function(key) {
            return obj.hasOwnProperty(key);
        },
        delete: function(key) {
            if (obj.hasOwnProperty(key)) {
                delete obj[key];
                return true;
            }
            return false;
        },
        clear: function() {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    delete obj[key];
                }
            }
        }
    };
}
