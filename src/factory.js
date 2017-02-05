import isUndefined from 'lodash.isundefined';
import isFunction from 'lodash.isfunction';
import isObject from 'lodash.isobject';
import uniqueId from 'lodash.uniqueid';

/**
 * Helper for getIdentityOf
 * @param {String} attr Name of attribute for getting identity in object.
 * @return {Function} Function for getting identity.
 */
function getDefaultIdentityGetter(attr) {
    return function(obj) {
        return obj[attr];
    };
}

/**
 * Factory
 */
export default class Factory {
    /**
     * Construct a new Factory instance.
     * @param {Object|Map} constructorMap Identities mapped to constructors.
     * @param {String|Function} identityGetter Name of identity attribute, or function for getting identity.
     */
    constructor(constructorMap, identityGetter) {
        // Require constructorMap
        if (isUndefined(constructorMap)) {
            throw new TypeError('constructorMap required.');
        }
        // Map for Constructors
        this._constructorMap = constructorMap;
        // identityGetter is function?
        if (isFunction(identityGetter)) {
            this._identityGetter = identityGetter;
        } else { // Assume undefined or string
            this._identityGetter = getDefaultIdentityGetter(identityGetter || 'identity');
        }
        // Unique client id
        this.cid = uniqueId('factory');
    }
    /**
     * Get the identity key of object, e.g. 'mozy.Model'.
     * @param {Object} obj Object with polymorphic identity.
     * @return {String}
     */
    getIdentityOf(obj) {
        // Require obj
        if (!isObject(obj)) {
            throw new TypeError('Argument obj must be Object');
        }
        // Return identity
        return this._identityGetter.call(this, obj);
    }
    /**
     * Same as getIdentityOf, but throws error if undefined.
     * @param {Object} obj Object with polymorphic identity.
     * @return {String}
     */
    requireIdentityOf(obj) {
        const identity = this.getIdentityOf(obj);
        if (isUndefined(identity)) {
            throw new TypeError('Undefined identity in object.');
        }
        return identity;
    }
    /**
     * Check if object has identity.
     * @param {Object} obj Object with polymorphic identity.
     * @return {boolean}
     */
    hasIdentity(obj) {
        return isUndefined(this.getIdentityOf(obj)) === false;
    }
    /**
     * Get Constructor registered for identity.
     * @param {String} identity Identity of constructor.
     * @return {Function} Constructor
     */
    getConstructor(identity) {
        // Get constructor from identity
        let Constructor = this._constructorMap[identity];
        // If undefined, try with .get method
        if (!Constructor && isFunction(this._constructorMap.get)) {
            Constructor = this._constructorMap.get(identity);
        }
        // Still not found?
        if (!Constructor) {
            throw new TypeError('Constructor for identity "' + identity + '" not found. Not registered?');
        }
        return Constructor;
    }
    /**
     * Get Constructor registered for identity found in object.
     * @param {Object} obj Object with polymorphic identity.
     * @return {Function} Constructor
     */
    getConstructorFor(obj) {
        return this.getConstructor(this.requireIdentityOf(obj));
    }
    /**
     * Get new instance of Constructor registered for identity.
     * @param {String} identity Identity of constructor.
     * @param {...} constructorArgs Arguments passed to Constructor.
     * @return {Object} Instance of Constructor.
     */
    newInstance(identity, ...constructorArgs) {
        // Get constrcutor from identity
        const Constructor = this.getConstructor(identity);
        // Return new instance of Constructor
        return new Constructor(...constructorArgs);
    }
    /**
     * Get new instance of Constructor registered for identity in object.
     * @param {Object} obj Object with polymorphic identity.
     * @param {...args} constructorArgs Arguments passed to Constructor.
     * @return {Object} Instance of Constructor.
     */
    newInstanceFor(obj, ...constructorArgs) {
        const identity = this.requireIdentityOf(obj);
        constructorArgs = constructorArgs || [obj];
        return this.newInstance(identity, ...constructorArgs);
    }

}
