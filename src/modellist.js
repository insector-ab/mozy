import uniqueId from 'lodash.uniqueid';
import {RESET_REFERENCE, flagIsSet} from './model';

/**
 * Default getItemFunction for ModelList.
 * @param  {Model} model The Model to get the item from.
 * @return {*} Anything JSON serializable.
 */
function defaultGetItemFunction(model) {
    return model.getModelData();
}

/**
 * ModelList
 */
export class ModelList {

    constructor(items, getModelFunction, getItemFunction) {
        // Raw items in list
        this._items = items;
        // Function for getting Model instances
        this._getModelFunction = getModelFunction;
        // Function for getting items from Models
        this._getItemFunction = getItemFunction || defaultGetItemFunction;
        // Modifed timestamp
        this._modified = null;
        // Unique client id
        this._cid = uniqueId('modellist');
    }

    get cid() {
        return this._cid;
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

    get models() {
        return this._items.map(item => {
            return this._getModel(item);
        });
    }
    set models(value) {
        this.items = value.map(model => {
            return this._getItem(model);
        });
    }
    /**
     * Moment when modified.
     * @return {moment}
     */
    get modified() {
        return this._modified;
    }

    get lastChild() {
        if (this.length === 0) {
            return null;
        }
        return this.at(this.length - 1);
    }
    /**
     * Interface for Model.updateProperty.
     * @param {Array} items List of anything JSON serializable.
     */
    update(items) {
        this.reset(items);
    }

    at(index) {
        return this._getModel(this.items[index]);
    }

    add(model) {
        return this.addAt(model, this.length);
    }

    addAt(model, index) {
        // Add model at index
        this._items.splice(index, 0, this._getItem(model));
        // Modified
        this.updateModified();
        // return
        return model;
    }

    remove(model) {
        // index
        const index = this.indexOf(model);
        // if not found, return null to indicate nothing was removed
        if (index === -1) {
            return null;
        }
        // Remove obj at index
        this._items.splice(index, 1);
        // Set modified
        this.updateModified();
        // return model to indicate it was removed
        return model;
    }

    removeAt(index) {
        // get item
        const model = this.at(index);
        // use remove method
        return this.remove(model);
    }
    /**
     * Return index of model in list.
     * @param {Model} model The Model to find the index of.
     * @return {Integer} Index of model.
     */
    indexOf(model) {
        const item = this._getItem(model);
        return this._items.indexOf(item);
    }

    reset(items, flags = 0) {
        // remove current items
        while (this._items.length) { this._items.pop(); };
        // If RESET_REFERENCE flag
        if (flagIsSet(flags, RESET_REFERENCE)) {
            // Set new reference
            this._items = items;
        // else, keep reference and push items
        } else {
            for (let item of items) {
                this._items.push(this._getItem(this._getModel(item)));
            }
        }
        // modified
        this.updateModified();
    }
    /**
     * Update modified timestamp.
     * @param {timestamp} modified Time of modification or undefined if now.
     */
    updateModified(modified) {
        this._modified = modified || Date.now();
    }
    /**
     * Dispose ModelList.
     */
    dispose() {
        this._deleteReferences();
    }
    /**
     * Get Model from item in list.
     * @param {*} item Anything JSON serializable.
     * @return {Model} The Model instance.
     */
    _getModel(item) {
        return this._getModelFunction(item);
    }
    /**
     * Get item to store in list.
     * @param {Model} model The Model to get the item from.
     * @return {*} Anything JSON serializable.
     */
    _getItem(model) {
        return this._getItemFunction(model);
    }
    /**
     * Delete references set on model.
     */
    _deleteReferences() {
        delete this._items;
        delete this._modified;
        delete this._getModel;
        delete this._getItem;
    }

    [Symbol.iterator]() {
        let i = 0;
        const iterator = {
            next: () => {
                let item = this._items[i];
                let done = i >= this._items.length;
                let value;
                if (!done) {
                    value = this._getModel(item);
                }
                i++;
                return {value, done};
            }
        };
        return iterator;
    }

}
