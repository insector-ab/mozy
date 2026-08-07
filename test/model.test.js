/* eslint no-unused-expressions: "off" */
import { v4 as uuidV4, validate as uuidValidate, version as uuidVersion } from 'uuid';
import * as chai from 'chai';

import { Model } from '../src/index.js';
import {
  Dimensions,
  Rect
} from './layout.js';

chai.should();
const { expect } = chai;

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

      it('should remap values that exactly equal a replaced uuid', function() {
        const rect = new Rect();
        const source = new Model({ box: rect.getDataReference(), boxRef: rect.uuid });
        const copied = source.copy();
        copied.get('boxRef').should.equal(copied.get('box').uuid);
        copied.get('boxRef').should.not.equal(rect.uuid);
      });

      it('should not touch strings that merely contain a replaced uuid', function() {
        const rect = new Rect();
        const source = new Model({ box: rect.getDataReference(), note: `see ${rect.uuid}` });
        const copied = source.copy();
        copied.get('note').should.equal(`see ${rect.uuid}`);
      });

      it('should remap object keys that exactly equal a replaced uuid', function() {
        const rect = new Rect();
        const source = new Model({ box: rect.getDataReference(), lookup: { [rect.uuid]: 'meta' } });
        const copied = source.copy();
        const newUuid = copied.get('box').uuid;
        copied.get('lookup').should.have.property(newUuid, 'meta');
        copied.get('lookup').should.not.have.property(rect.uuid);
      });

      it('should honor toJSON on nested objects, like JSON.stringify', function() {
        const rect = new Rect();
        const date = new Date(0);
        const source = new Model({ box: rect, created: date });
        const copied = source.copy();
        copied.get('box').should.not.be.instanceOf(Model);
        copied.get('box').should.have.property('identity', Rect.identity);
        isUuidV4(copied.get('box').uuid).should.equal(true);
        copied.get('box').uuid.should.not.equal(rect.uuid);
        copied.get('created').should.equal(date.toJSON());
      });

      it('should copy an own "__proto__" key as data without touching the prototype', function() {
        const source = new Model(JSON.parse('{"nested": {"__proto__": {"x": 1}, "y": 2}}'));
        const copied = source.copy();
        const nested = copied.get('nested');
        Object.getPrototypeOf(nested).should.equal(Object.prototype);
        Object.getOwnPropertyDescriptor(nested, '__proto__').value.should.deep.equal({ x: 1 });
        nested.y.should.equal(2);
      });

      it('should copy a complex model graph with arrays and cross-branch references', function() {
        const shared = new Rect();
        const deep = new Dimensions();
        const source = new Model({
          children: [
            { identity: 'test.Node', uuid: uuidV4(), nested: { deep: deep.getDataReference(), siblingRef: shared.uuid } },
            shared.getDataReference()
          ],
          lookup: { shared: shared.uuid, refs: [shared.uuid, deep.uuid], tags: ['a', 'b'], count: 3, nothing: null }
        });
        const copied = source.copy();
        const data = copied.getDataReference();
        // All uuid keys replaced
        data.children[0].uuid.should.not.equal(source.get('children')[0].uuid);
        data.children[1].uuid.should.not.equal(shared.uuid);
        data.children[0].nested.deep.uuid.should.not.equal(deep.uuid);
        isUuidV4(data.children[1].uuid).should.equal(true);
        // References remapped consistently across branches
        data.children[0].nested.siblingRef.should.equal(data.children[1].uuid);
        data.lookup.shared.should.equal(data.children[1].uuid);
        data.lookup.refs.should.deep.equal([data.children[1].uuid, data.children[0].nested.deep.uuid]);
        // Non-uuid values intact
        data.lookup.tags.should.deep.equal(['a', 'b']);
        data.lookup.count.should.equal(3);
        expect(data.lookup.nothing).to.equal(null);
        // Original untouched
        source.get('children')[1].uuid.should.equal(shared.uuid);
      });

    });

  });

  describe('Mutations and events', () => {

    it('should emit change events when values mutate', function() {
      const model = new Model();
      let propertyEvents = 0;
      let changeEvents = 0;
      model.addEventListener('change value', (eventType, sender, newValue, oldValue) => {
        eventType.should.equal('change value');
        sender.should.equal(model);
        newValue.should.equal(10);
        expect(oldValue).to.be.undefined;
        propertyEvents++;
      });
      model.addEventListener('change', () => { changeEvents++; });
      model.set('value', 10);
      propertyEvents.should.equal(1);
      changeEvents.should.equal(1);
      model.set('value', 20, { setSilent: true });
      propertyEvents.should.equal(1);
    });

    it('should support toggle/unset helpers and track changes', function() {
      const model = new Model();
      model.toggle('flag').get('flag').should.equal(true);
      model.toggle('flag').get('flag').should.equal(false);
      model.set('token', 'value');
      model.set('token', '', { unsetIfFalsy: true });
      model.has('token').should.equal(false);
      model.set('level', 1);
      model.hasChanged('level').should.equal(true);
      expect(model.getPrevious('level')).to.equal(undefined);
      model.unset('level');
      model.has('level').should.equal(false);
    });

    it('should assign and reset data while preserving uuid', function() {
      const model = new Model();
      model.assignData({ foo: 'bar' });
      model.get('foo').should.equal('bar');
      model.assignData({ baz: 1 }, { setSilent: true });
      model.get('baz').should.equal(1);
      const dim = new Dimensions();
      dim.contentBox.width = 42;
      const originalUuid = dim.uuid;
      dim.resetData({ width: 10 });
      dim.uuid.should.equal(originalUuid);
      dim.get('width').should.equal(10);
    });

    it('should dispose models and remove references', function() {
      const model = new Model();
      model.dispose();
      expect(model._data).to.be.undefined;
      expect(model._previousData).to.be.undefined;
    });

  });

});
