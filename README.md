# mozy
A model library using [lazy initialization](https://en.wikipedia.org/wiki/Lazy_initialization), factories and instance registries.

## Installation

```sh
npm install mozy
```

## Test

(WIP)

```sh
npm test
```
```sh
npm run coverage
```
Current coverage:
```
=============================== Coverage summary ===============================
Statements   : 25.53% ( 85/333 )
Branches     : 15.7% ( 27/172 )
Functions    : 35.29% ( 6/17 )
Lines        : 26.33% ( 84/319 )
================================================================================
```

## Defining models

```javascript
import mozy from 'mozy';

export class Rect extends mozy.Model {

    get x() {
        return this.get('x');
    }
    set x(value) {
        this.set('x', value);
    }

    get y() {
        return this.get('y');
    }
    set y(value) {
        this.set('y', value);
    }

    get width() {
        return this.get('width');
    }
    set width(value) {
        this.set('width', value);
    }

    get height() {
        return this.get('height');
    }
    set height(value) {
        this.set('height', value);
    }

    _getDefaults() {
        const d = super._getDefaults();
        d.identity = Rect.identity;
        d.x = 0.0;
        d.y = 0.0;
        d.width = 0.0;
        d.height = 0.0;
        return d;
    }

}

Rect.identity = 'shape.Rect';

/**
 * Skipping EdgeSizes definition
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
        const d = super._getDefaults();
        d.identity = Dimensions.identity;
        d.contentBox = (new Rect).data;
        d.padding = (new EdgeSizes).data;
        d.borderWidth = (new EdgeSizes).data;
        d.margin = (new EdgeSizes).data;
        return d;
    }

}

Dimensions.identity = 'layout.Dimensions';

/**
 * Register identities
 */
mozy.identities.set(Rect.identity,       Rect);
mozy.identities.set(EdgeSizes.identity,  EdgeSizes);
mozy.identities.set(Dimensions.identity, Dimensions);
```

## Using models

```javascript
const dim = new Dimensions();
dim.contentBox.width = 100;
dim.contentBox.height = 40;
dim.padding.left = 10;
dim.padding.right = 10;
dim.borderWidth.top = 1;
dim.borderWidth.bottom = 1;

const jsonStr = JSON.stringify(dim.data);
console.log(jsonStr);
```

Will log:

```json
{
  "identity": "layout.Dimensions",
  "uuid": "7366c996-1f8a-482b-ae36-c8e8b988c75c",
  "contentBox": {
    "identity": "shape.Rect",
    "uuid": "451775cc-3b44-4a3a-b9b3-e7ce110ddf80",
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 40
  },
  "padding": {
    "identity": "layout.EdgeSizes",
    "uuid": "8c128fbb-c7b9-4fba-9cb5-005e5586554b",
    "top": 0,
    "right": 10,
    "bottom": 0,
    "left": 10
  },
  "borderWidth": {
    "identity": "layout.EdgeSizes",
    "uuid": "63a3c87c-9575-4a15-8084-2ba54bd13d38",
    "top": 1,
    "right": 0,
    "bottom": 1,
    "left": 0
  },
  "margin": {
    "identity": "layout.EdgeSizes",
    "uuid": "91ec1d41-3f06-4cf6-8c73-dbd6c8923cab",
    "top": 0,
    "right": 0,
    "bottom": 0,
    "left": 0
  }
}
```

Restoring the model from data dict:

```javascript
const data = JSON.parse(jsonStr);
const dim = new Dimensions(data);
console.log(dim.padding.right) // 10
```

Or, if root constructor is unknown, using the registry:

```javascript
import mozy from 'mozy';

const data = JSON.parse(jsonStr);
const model = mozy.registry.getModel(data);
console.log(model.padding.right) // 10
```

## License

This software is licensed under the [MIT License](https://github.com/insector-ab/mozy/blob/master/LICENSE).
