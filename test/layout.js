import mozy from '../index';

/**
 * Assertion helpers.
 */
function assertType(property, value, typeofValue) {
    if (typeof value !== typeofValue) {
        throw new TypeError(property + ' must be of type "' + typeofValue + '".');
    }
}
function assertNumber(property, value) {
    assertType(property, value, 'number');
}

/**
 * Rect
 */
export class Rect extends mozy.Model {

    get x() {
        return this.get('x');
    }
    set x(value) {
        assertNumber('Rect.x', value);
        this.set('x', value);
    }

    get y() {
        return this.get('y');
    }
    set y(value) {
        assertNumber('Rect.y', value);
        this.set('y', value);
    }

    get width() {
        return this.get('width');
    }
    set width(value) {
        assertNumber('Rect.width', value);
        this.set('width', value);
    }

    get height() {
        return this.get('height');
    }
    set height(value) {
        assertNumber('Rect.height', value);
        this.set('height', value);
    }

    _validate(data) {
        assertNumber('x', data.x);
        assertNumber('y', data.y);
        assertNumber('width', data.width);
        assertNumber('height', data.height);
    }

    _getDefaults() {
        let d = super._getDefaults();
        d.identity = Rect.identity;
        d.x = 0.0;
        d.y = 0.0;
        d.width = 0.0;
        d.height = 0.0;
        return d;
    }

}
// Polymorphic identity
Rect.identity = 'layout.Rect';
// Register model
mozy.modelIdentities.set(Rect.identity, Rect);

/**
 * EdgeSizes
 */
export class EdgeSizes extends mozy.Model {

    get top() {
        return this.get('top');
    }
    set top(value) {
        assertNumber('EdgeSizes.top', value);
        this.set('top', value);
    }

    get right() {
        return this.get('right');
    }
    set right(value) {
        assertNumber('EdgeSizes.right', value);
        this.set('right', value);
    }

    get bottom() {
        return this.get('bottom');
    }
    set bottom(value) {
        assertNumber('EdgeSizes.bottom', value);
        this.set('bottom', value);
    }

    get left() {
        return this.get('left');
    }
    set left(value) {
        assertNumber('EdgeSizes.left', value);
        this.set('left', value);
    }

    _validate(data) {
        assertNumber('top', data.top);
        assertNumber('right', data.right);
        assertNumber('bottom', data.bottom);
        assertNumber('left', data.left);
    }

    _getDefaults() {
        let d = super._getDefaults();
        d.identity = EdgeSizes.identity;
        d.top = 0.0;
        d.right = 0.0;
        d.bottom = 0.0;
        d.left = 0.0;
        return d;
    }
}
// Polymorphic identity
EdgeSizes.identity = 'layout.EdgeSizes';
// Register model
mozy.modelIdentities.set(EdgeSizes.identity, EdgeSizes);

/**
 * Dimensions
 */
export class Dimensions extends mozy.Model {

    get contentBox() {
        return this._getModel('contentBox');
    }

    get padding() {
        return this._getModel('padding');
    }

    get borderWidth() {
        return this._getModel('borderWidth');
    }

    get margin() {
        return this._getModel('margin');
    }

    _getModel(property) {
        return mozy.registry.getModel(this.get(property));
    }

    _getDefaults() {
        let d = super._getDefaults();
        d.identity = Dimensions.identity;
        d.contentBox = (new Rect()).getModelData();
        d.padding = (new EdgeSizes()).getModelData();
        d.borderWidth = (new EdgeSizes()).getModelData();
        d.margin = (new EdgeSizes()).getModelData();
        return d;
    }

}
// Polymorphic identity
Dimensions.identity = 'layout.Dimensions';
// Register model
mozy.modelIdentities.set(Dimensions.identity, Dimensions);
