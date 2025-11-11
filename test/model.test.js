/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import { v4 as uuidV4, validate as uuidValidate, version as uuidVersion } from 'uuid';
import chai from 'chai';

import { Model } from '../src/index';
import {
  Dimensions,
  Rect
} from './layout';

chai.should();

const isUuidV4 = value => uuidValidate(value) && uuidVersion(value) === 4;

describe('Model', () => {
  let dimensions;

  beforeEach(() => {
    // Create a new Dimensions instance before every test.
    dimensions = new Dimensions();
  });

  // Use cases
  describe('Use cases', () => {
    // Write
  });

  // Interface
  describe('Interface', () => {

    // Constructor
    describe('constructor(data = {}, ...args)', () => {

      it('should create a Model instance', function() {
        // Model
        const model = new Model();
        model.getDataReference().should.satisfy(value => {
          return value.identity === Model.identity &&
                 isUuidV4(value.uuid);
        });
        // Model subclass
        dimensions.getDataReference().should.satisfy(value => {
          return value.identity === Dimensions.identity &&
                 isUuidV4(value.uuid);
        });
      });

      it('should handle data argument', function() {
        // Set model value
        dimensions.contentBox.width = 100;
        // dimensions data
        const data = dimensions.getDeepClonedModelData();
        // New Dimensions instance
        const newDim = new Dimensions(data);
        // model getter
        newDim.contentBox.width.should.equal(100);
        // model data
        newDim.getDataReference().should.satisfy(value => {
          return value.identity === Dimensions.identity &&
                 isUuidV4(value.uuid) &&
                 value.contentBox.width === 100;
        });
      });

    });

    // Attribute: uuid
    describe('.uuid', () => {

      it('should be a string', function() {
        dimensions.uuid.should.be.a('string');
      });

      it('should be UUID format version 4', function() {
        isUuidV4(dimensions.uuid).should.be.true;
      });

      it('can\'t be set', function() {
        const setUuid = function() { dimensions.uuid = uuidV4(); };
        setUuid.should.throw(TypeError);
      });

    });

    // Method: getModelIdentity
    describe('.getModelIdentity()', () => {

      it('should be a string', function() {
        (new Model()).getModelIdentity().should.be.a('string');
        dimensions.getModelIdentity().should.be.a('string');
      });

    });

    // Method: getModelData
    describe('.getDeepClonedModelData()', () => {

      it('should be an object', function() {
        (new Model()).getDeepClonedModelData().should.be.a('object');
        dimensions.getDeepClonedModelData().should.be.a('object');
      });

      it('should not be the underlying data reference', function() {
        dimensions.getDeepClonedModelData().should.not.equal(dimensions.getDataReference());
      });

    });

    // Method: getDataReference
    describe('.getDataReference()', () => {

      it('should be an object', function() {
        (new Model()).getDataReference().should.be.a('object');
        dimensions.getDataReference().should.be.a('object');
      });

      it('should be the underlying data reference', function() {
        dimensions.getDataReference().should.equal(dimensions._data);
      });

    });

    // Method: copy
    describe('.copy()', () => {
      // Create a new Rect instance before every test.
      const box = new Rect();
      // Create new Dimensions instances before every test.
      const dim1 = new Dimensions({ contentBox: box.getDataReference() });
      dim1.margin.left = 100;
      const dim2 = new Dimensions({ contentBox: box.getDataReference() });
      dim2.padding.top = 50;
      // Model
      const model = new Model({
        dim1: dim1.getDataReference(),
        dim2: dim2.getDataReference(),
        someUuidReference: uuidV4()
      });
      // Copy
      const copiedModel = model.copy();
      // New instances of Dimensions with copied data
      const newDim1 = new Dimensions(copiedModel.get('dim1'));
      const newDim2 = new Dimensions(copiedModel.get('dim2'));

      it('should properly copy model properties', function() {
        // Margin value should be the same
        dim1.margin.left.should.equal(newDim1.margin.left);
        // Padding value should be the same
        dim2.padding.top.should.equal(newDim2.padding.top);
      });

      it('should replace multiple instances of an uuid with the same new uuid', function() {
        // contentBox uuids should be the same
        newDim1.contentBox.uuid.should.equal(newDim2.contentBox.uuid);
      });

      it('should preserve uuid references (key !== "uuid")', function() {
        model.get('someUuidReference').should.equal(copiedModel.get('someUuidReference'));
      });

    });

  });

});
