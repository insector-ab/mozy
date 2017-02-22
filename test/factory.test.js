/* eslint-env mocha */
import chai from 'chai';
import {Model, Factory, modelIdentities} from '../index';
import {Rect, EdgeSizes, Dimensions} from './layout';

chai.should();

/**
 * Helper class for test
 */
class CustomMap {
    constructor(iterable) {
        this._map = Object.create(undefined);
        for (let [key, value] of iterable) {
            this._map[key] = value;
        }
    }
    get(key) {
        return this._map[key];
    }
}

/**
 * Use case helper
 */
function describeWithMap(map) {
    // No constructor errors
    it('should instantiate without error', function() {
        const newFactory = function() { return new Factory(map); };
        newFactory.should.not.throw(Error);
    });
    // New instance
    it('should return new instance of existing identity', function() {
        const factory = new Factory(map);
        const dim = factory.newInstance(Dimensions.identity);
        dim.should.be.an.instanceof(Dimensions);
    });
    // Non existing
    it('should throw error for non-existing identity', function() {
        const factory = new Factory(map);
        const newInstance = function() { return factory.newInstance('non-existing-identity'); };
        newInstance.should.throw(TypeError);
    });
}

/**
 * Factory tests
 */
describe('Factory', () => {
    // Use cases
    describe('Use cases', () => {
        // Object as map
        describe('Using Object as map', () => {
            const objMap = {};
            objMap[Rect.identity] = Rect;
            objMap[EdgeSizes.identity] = EdgeSizes;
            objMap[Dimensions.identity] = Dimensions;
            // Describe with map
            describeWithMap(objMap);
        });
        // Map as map
        describe('Using ES6 Map', () => {
            const es6Map = new Map([
                [Rect.identity, Rect],
                [EdgeSizes.identity, EdgeSizes],
                [Dimensions.identity, Dimensions]
            ]);
            // Describe with map
            describeWithMap(es6Map);
        });
        // Custom object with .get method
        describe('Using object that implements .get() method', () => {
            const customMap = new CustomMap([
                [Rect.identity, Rect],
                [EdgeSizes.identity, EdgeSizes],
                [Dimensions.identity, Dimensions]
            ]);
            // Describe with map
            describeWithMap(customMap);
        });
    });
    // API
    describe('API', () => {
        // Constructor
        describe('constructor(constructorMap, identityGetter)', () => {
            // Check return type
            it('should require constructorMap', function() {
                const newInstanceWithoutArgs = function() { return new Factory(); };
                newInstanceWithoutArgs.should.throw(TypeError);
            });
        });
        // Method: getIdentityOf
        describe('.getIdentityOf(obj)', () => {
            const factory = new Factory(modelIdentities);
            const model = new Model();
            // Check return type
            it('should require an object as argument', function() {
                const getIdentityOfUndefined = function() { factory.getIdentityOf(); };
                getIdentityOfUndefined.should.throw(TypeError);
            });
            // Check return type of Model instance
            it('should return Model.identity for (new Model()).getModelData()', function() {
                factory.getIdentityOf(model.getModelData()).should.equal(Model.identity);
            });
        });
    });
});
