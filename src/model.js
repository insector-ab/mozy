import EventEmitter from 'events';
import uniqueId from 'lodash.uniqueid';
import isObject from 'lodash.isobject';
import isFunction from 'lodash.isfunction';
import isUndefined from 'lodash.isundefined';
import uuidV4 from 'uuid/v4';

/**
 * Model identities
 */
export const identities = new Map();
/**
 * Flags for controlling mutation.
 * Flag index n must have value 2^n.
 * @example
 * this.set('active', value, UNSET_IF_FALSE);
 * this.set('active', value, UNSET_IF_FALSE + SET_SILENT);
 */
export const SET_SILENT = 1; // Don't dispatch event when setting.
export const UNSET_IF_FALSE = 2; // If value evaluates to Boolean False, unset property.
export const SOFT_UPDATE = 4; // During update, if no setter or model found, use set() silent.
export const RESET_REFERENCE = 8; // Reset this._data or this._items references in reset().
/**
 * Helper for checking flags, e.g. for Model.set().
 * @param {Integer} dec Sum of flags.
 * @param {Integer} flag Flag to check.
 * @return {boolean} True if flag is set.
 */
export function flagIsSet(dec, flag) {
    const binStr = (dec >>> 0).toString(2);
    const flagIndex = binStr.length - (flag >>> 0).toString(2).length;
    return binStr[flagIndex] === '1';
}
/**
 * Model
 */
export default class Model extends EventEmitter {
    /**
     * Model.constructor
     * @param {Object} data JSON serializable object.
     * @param {...} args Arguments passed to _getDefaults().
     */
    constructor(data = {}, ...args) {
        super();
        // Update with defaults
        this._withDefaults(data, ...args);
        // Validate data
        this._validate(data);
        // Valid, set
        this._data = data;
        // Store previous
        this._previousData = {};
        // Store modified
        this._modified = undefined;
        // Client id
        this._cid = this._getUniqueClientId();
    }
    /**
     * Get client id. Not persisted.
     * @return {String}
     */
    get cid() {
        return this._cid;
    }
    /**
     * Get uuid.
     * @return {String}
     */
    get uuid() {
        return this.get('uuid');
    }
    /**
     * Underlying data object for model.
     * @return {String} Model polymorphic identity.
     */
    getModelIdentity() {
        return this.get('identity');
    }
    /**
     * Underlying data object for model.
     * @return {Object} JSON serializable object.
     */
    getModelData() {
        return this._data;
    }
    /**
     * Get value of data.property.
     * @param {String} property Name of property.
     * @param {*} defaultValue Default value to return if property is undefined.
     * @return {*}
     */
    get(property, defaultValue) {
        return this.has(property) ? this._data[property] : defaultValue;
    }
    /**
     * Return previous value of property.
     * @param {String} property Name of property.
     * @return {*}
     */
    getPrevious(property) {
        return this._previousData[property];
    }
    /**
     * Check if property is set in data.
     * @param {String} property Name of property.
     * @return {boolean} True if set.
     */
    has(property) {
        return this._data.hasOwnProperty(property);
    }
    /**
     * Check if previous value of property is same
     * as current.
     * @param {list of strings} properties Names of properties.
     * @return {boolean} True if any of them has changed.
     */
    hasChanged(...properties) {
        for (let prop of properties) {
            if (this._previousData[prop] !== this._data[prop]) {
                return true;
            }
        }
        return false;
    }
    /**
     * Set value of data.property.
     * @param {String} property Name of property.
     * @param {*} value Anything JSON serializable.
     * @param {Integer} flags (@see constants).
     * @return {Model} The Model object.
     */
    set(property, value, flags = 0) {
        // Unset?
        if (flagIsSet(flags, UNSET_IF_FALSE) && Boolean(value) === false) {
            this.unset(property, flags);
            return;
        }
        // Previous value
        this._previousData[property] = this._data[property];
        // If property not set or value different
        if (!this.has(property) || this._data[property] !== value) {
            // Set new value
            this._data[property] = value;
            // Set modified
            this.updateModified();
        }
        // Dispatch change event, if not silent
        if (this.hasChanged(property) && !flagIsSet(flags, SET_SILENT)) {
            this.dispatchChange(property, value, this._previousData[property]);
        }
        // Return
        return this;
    }
    /**
     * Toggle boolean property.
     * @param {String} property Name of property.
     * @param {Integer} flags (@see constants).
     * @return {Model} The Model object.
     */
    toggle(property, flags = 0) {
        const current = this.get(property, false); // False if not set
        return this.set(property, !current, flags); // Set to !current
    }
    /**
     * Unset value of data.property.
     * @param {String} property Name of property.
     * @param {Integer} flags (@see constants).
     * @return {boolean} True if property found and unset.
     */
    unset(property, flags = 0) {
        // Previous value
        this._previousData[property] = this._data[property];
        // Present in _data
        const present = this._data.hasOwnProperty(property);
        // Delete from data
        delete this._data[property];
        // Has changed?
        if (this.hasChanged(property)) {
            // Set modified
            this.updateModified();
            // Dispatch change event, if not silent
            if (!flagIsSet(flags, SET_SILENT)) {
                this.dispatchChange(property, undefined, this._previousData[property]);
            }
        }
        // True if present and deleted.
        return present;
    }
    /**
     * Delete multiple properties from data.
     * @param {list of strings} properties
     * @return {Model} The Model object.
     */
    unsetMultiple(...properties) {
        for (let prop of properties) {
            this._previousData[prop] = this._data[prop];
            delete this._data[prop];
        }
        if (this.hasChanged(...properties)) {
            this.updateModified();
        }
        // Return
        return this;
    }
    /**
     * Reset underlying data object for model.
     * @param {Object}  data JSON serializable object.
     * @param {Integer} flags (@see constants).
     * @return {Model} The Model object.
     */
    reset(data, flags = 0) {
        data = data || {};
        // Keep identity and uuid
        const {uuid, identity} = this._data;
        Object.assign(data, {uuid, identity});
        // Update new data with defaults
        this._withDefaults(data);
        // If reset reference flag
        if (flagIsSet(flags, RESET_REFERENCE)) {
            // Reset data reference
            this._data = data;
            // Dispatch change event, if not silent
            if (!flagIsSet(flags, SET_SILENT)) {
                this.dispatchChange();
            }
        // else, reset properties but keep this reference (not recursive)
        } else {
            // Unset properties not in data
            Object.keys(this._data).forEach(property => {
                if (isUndefined(data[property])) {
                    this.unset(property, flags);
                }
            })
            // Recursive reset or updateProperty
            Object.keys(this._data).forEach(property => {
                // Check recursiveness
                let currentVal = this[property];
                if (currentVal && isFunction(currentVal.reset)) {
                    currentVal.reset(data[property], flags);
                // Just update
                } else {
                    this.updateProperty(property, data[property], flags)
                }
            });
        }
        // Validate
        this._validate(this._data);
        // Return
        return this;
    }
    /**
     * Recursively update model properties.
     * @param {Object} data JSON serializable object.
     * @param {Integer} flags (@see constants).
     * @return {Model} The Model object.
     */
    update(data, flags = 0) {
        // Iterate data dict
        Object.keys(data).forEach(prop => {
            this.updateProperty(prop, data[prop], flags);
        });
        // Set modified
        this.updateModified();
        // Notify if not silent. Dispatch for each property?
        if (!flagIsSet(flags, SET_SILENT)) {
            this.dispatchChange();
        }
        // Return
        return this;
    }
    /**
     * Update single property.
     * @param {String} property Name of property.
     * @param {*} value Anything JSON serializable.
     * @param {Integer} flags (@see constants).
     * @return {Model} The Model object.
     */
    updateProperty(property, value, flags = 0) {
        // Check if setter exists
        if (typeof this.__lookupSetter__(property) !== 'undefined') {
            this[property] = value;
            return this;
        }
        // No setter, check if getter returns model
        const currentVal = this[property];
        if (currentVal && isFunction(currentVal.update)) {
            // If yes, update recursively.
            currentVal.update(value);
            return this;
        }
        // Soft update
        if (flagIsSet(flags, SOFT_UPDATE)) {
            this.set(property, value, SET_SILENT);
            return this;
        }
        // If no setter or sub model, throw error.
        throw new Error('Could not update property "' + property + '" on ' + this.constructor.name + '.');
    }
    /**
     * Update modified timestamp.
     * @param {timestamp} modified Time of modification or undefined if now.
     * @return {Model} The Model object.
     */
    updateModified(modified) {
        this._modified = modified || Date.now();
        // Return
        return this;
    }
    /**
     * Return a copy of this model, with new uuids.
     * FIX: Better way to do this?
     * @return {Model} New instance of Model (or Model subclass).
     */
    copy() {
        // stringify data dict
        const jsonStr = JSON.stringify(this._data);
        // replace all uuids with new one's.
        const uuidRegexp = /"uuid":"........-....-....-....-............"/g;
        const newJsonStr = jsonStr.replace(uuidRegexp, () => {
            return '"uuid":"' + uuidV4() + '"';
        });
        // return instance of this
        const Constructor = this.constructor;
        return new Constructor(JSON.parse(newJsonStr));
    }
    /**
     * Interface for dispatching events.
     * Currently alias for EventEmitter.emit. May change.
     * @param {String} eventType Event type key.
     * @param {...} args Arguments passed to listeners.
     * @return {Model} The Model object.
     */
    dispatchEvent(eventType, ...args) {
        this.emit(eventType, ...[this].concat(args));
        // Return
        return this;
    }
    /**
     * Dispatch change events.
     * @param {String} property Name of property.
     * @param {*} newValue Anything JSON serializable.
     * @param {*} oldValue Anything JSON serializable.
     * @return {Model} The Model object.
     */
    dispatchChange(property, newValue, oldValue) {
        if (property) {
            this.dispatchEvent('change ' + property, newValue, oldValue);
        }
        return this.dispatchEvent('change', this);
    }
    /**
     * Alias for EventEmitter.addListener
     */
    addEventListener(event, listener) {
        this.addListener(event, listener);
        // Return
        return this;
    }
    /**
     * Alias for EventEmitter.removeListener
     */
    removeEventListener(event, listener) {
        this.removeListener(event, listener);
        // Return
        return this;
    }
    /**
     * Dispose model and sub models recursively.
     * Remove event listeners and delete references.
     * @return {Model} The Model object.
     */
    dispose() {
        // Remove event listeners
        this.removeAllListeners()
        // Check sub models on this, recursively
        Object.keys(this).forEach(attr => {
            if (isObject(this[attr]) && isFunction(this[attr].dispose)) {
                this[attr].dispose();
            }
        });
        // delete refs
        this._deleteReferences();
        // Return
        return this;
    }
    /**
     * Delete references set on model.
     */
    _deleteReferences() {
        delete this._data;
        delete this._previousData;
        delete this._modified;
    }
    /**
     * Check validity of data. Throw error if not valid.
     * @param {Object} data JSON serializable object.
     */
    _validate(data) {
        // Abstract
    }
    /**
     * Return default data object for new instance.
     * @param {...} constructorArgs List of arguments passed in constructor.
     * @return {Object} Default data (JSON serializable object) for Model.
     */
    _getDefaults(...constructorArgs) {
        return {
            // Model polymorphic identity
            identity: Model.identity,
            // model uuid
            uuid: uuidV4()
        };
    }
    /**
     * Update data object with defaults.
     * @param {Object} data JSON serializable object.
     * @param {...} constructorArgs List of arguments passed in constructor.
     * @return {Model} The Model object.
     */
    _withDefaults(data, ...constructorArgs) {
        // defaults
        const defaultData = this._getDefaults(...constructorArgs);
        // Update undefined props from defaults
        Object.keys(defaultData).forEach(prop => {
            if (isUndefined(data[prop])) {
                data[prop] = defaultData[prop];
            }
        });
        return this;
    }
    /**
     * Return unique client id.
     * @return {String} Unique string.
     */
    _getUniqueClientId() {
        return uniqueId(this.getModelIdentity());
    }

}
// Polymorphic identity
Model.identity = 'mozy.Model';
// Register Model
identities.set(Model.identity, Model);
