import uuidV4 from 'uuid/v4';
import isObject from 'lodash.isobject';
import {DISPOSE, RESET_REFERENCE, flagIsSet} from './model';

/**
 * Get default ModelList handler object.
 * @param {ModelRegistry} modelRegistry The ModelRegistry from which to get the models.
 * @return {Object} The Object with the handler methods.
 */
export function getModelListHandler(modelRegistry) {
    return {
        getModel: function(item) {
            return modelRegistry.getModel(item);
        },
        getItem: function(model) {
            return model.getRawModelData();
        },
        findModel: function(item) {
            return modelRegistry.get(modelRegistry.getValidKeyIn(item));
        },
        disposeModel: function(item) {
            return modelRegistry.disposeModelByKey(modelRegistry.getValidKeyIn(item));
        }
    };
}
/**
 * Get ModelList handler object that stores uuid in target list,
 * and gets models via uuid. Assumes models already exist in registry.
 * @param {ModelRegistry} modelRegistry The ModelRegistry from which to get the models.
 * @param {String} keyAttr The attribute from which to get the registry key for models.
 * @return {Object} The Object with the handler methods.
 */
export function getRelationListHandler(modelRegistry, keyAttr = 'uuid') {
    return {
        getModel: function(key) {
            return modelRegistry.get(key); // key => value for keyAttr (eg uuid, id, cid).
        },
        getItem: function(model) {
            return model[keyAttr];
        },
        findModel: function(key) {
            return modelRegistry.get(key);
        },
        disposeModel: function(key) {
            return modelRegistry.disposeModelByKey(key);
        }
    };
}

/**
 * ModelList
 */
export default class ModelList {

    constructor(items, handler) {
        // Raw items in list
        this._items = items;
        // Handler object for getting models and storing items.
        this._handler = handler;
        // Modifed timestamp
        this._modified = undefined;
        // Uuid
        this.uuid = uuidV4();
    }

    get length() {
        return this._items.length;
    }

    get items() {
        return this._items;
    }
    set items(value) {
        this.reset(value);
    }
    /**
     * Get/set array of models in list.
     */
    get models() {
        return this._items.map(item => {
            return this._handler.getModel(item);
        });
    }
    set models(value) {
        this.items = value.map(model => {
            return this._handler.getItem(model);
        });
    }

    get modified() {
        return this._modified;
    }

    /**
     * Interface for Model.updateProperty.
     * @param {Array} items List of anything JSON serializable.
     */
    update(items, flags = 0) {
        const models = this.models;
        const il = models.length;
        let i, model;
        const itemStr = JSON.stringify(items);
        // remove missing models
        for (i = il - 1; i >= 0; i--) {
            model = this.at(i);
            // not found in new array
            if (itemStr.indexOf(model.uuid) === -1) {
                this.remove(model, flags);
            }
        }
        // add & update
        items.forEach((item, i) => {
            // nothing to update
            if (!isObject(item)) {
                return;
            }
            // find model
            model = this._handler.findModel(item);
            // update model
            if (model) {
                model.update(item, flags);
            // add new
            } else {
                this.addAt(this._handler.getModel(item), i);
            }
        });
        // modified
        return this.updateModified();
    }

    at(index) {
        if (this.items[index]) {
            return this._handler.getModel(this.items[index]);
        }
        return undefined;
    }

    add(model) {
        return this.addAt(model, this.length);
    }

    addAt(model, index) {
        // Add model at index
        this._items.splice(index, 0, this._handler.getItem(model));
        // Update modified and return this.
        return this.updateModified();
    }

    remove(model, flags = 0) {
        // index
        const index = this.indexOf(model);
        // Remove, update modified and return this.
        return this.removeAt(index, flags);
    }

    removeAt(index, flags = 0) {
        if (flagIsSet(flags, DISPOSE)) {
            this._handler.disposeModel(this.items[index]);
        }
        // Remove obj at index
        this._items.splice(index, 1);
        // Update modified and return this.
        return this.updateModified();
    }

    /**
     * Return index of model in list.
     * @param {Model} model The Model to find the index of.
     * @return {Integer} Index of model.
     */
    indexOf(model) {
        const item = this._handler.getItem(model);
        return this._items.indexOf(item);
    }

    reset(items, flags = 0) {
        // dispose models
        if (flagIsSet(flags, DISPOSE)) {
            this._items.forEach(item => {
                this._handler.disposeModel(item);
            });
        }
        // If RESET_REFERENCE flag
        if (flagIsSet(flags, RESET_REFERENCE)) {
            // Set new reference
            this._items = items;
        // else, keep reference and replace items
        } else {
            this._items.splice(0, this._items.length, ...items);
        }
        // modified
        return this.updateModified();
    }

    map(callback) {
        return this._items.map((item, index) => {
            return callback(this._handler.getModel(item), index);
        });
    }

    forEach(callback) {
        return this._items.forEach((item, index) => {
            callback(this._handler.getModel(item), index);
        });
    }
    /**
     * Update modified timestamp.
     * @param {timestamp} modified Time of modification or undefined if now.
     */
    updateModified(modified) {
        this._modified = modified || Date.now();
        return this;
    }
    /**
     * Dispose ModelList.
     */
    dispose() {
        this._deleteReferences();
    }
    /**
     * Delete references set on model.
     */
    _deleteReferences() {
        delete this._items;
        delete this._handler;
        delete this._modified;
    }

    [Symbol.iterator]() {
        let i = 0;
        const iterator = {
            next: () => {
                const done = i >= this._items.length;
                const value = done ? undefined : this._handler.getModel(this._items[i++]);
                return {value, done};
            }
        };
        return iterator;
    }

}
