# mozy &middot; [![GitHub license](https://img.shields.io/github/license/insector-ab/mozy.svg)](https://github.com/insector-ab/mozy/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/mozy.svg?style=flat)](https://www.npmjs.com/package/mozy) ![Coverage Status](https://img.shields.io/badge/Coverage%20(lines)-65%25-yellow.svg)
A model library using [lazy initialization](https://en.wikipedia.org/wiki/Lazy_initialization), factories and instance registries.


## Installation

```sh
npm install mozy
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

  /**
   * Skipping y, width, height ...
   */

  _getDefaults() {
    return Object.assign(super._getDefaults(), {
      identity: Rect.identity,
      x: 0.0,
      y: 0.0,
      width: 0.0,
      height: 0.0
    });
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
    return mozy.modelRegistry.getModel(this.get(property));
  }

  _getDefaults() {
    return Object.assign(super._getDefaults(), {
      identity: Dimensions.identity,
      contentBox: {identity: Rect.identity},
      padding: {identity: EdgeSizes.identity},
      borderWidth: {identity: EdgeSizes.identity},
      margin: {identity: EdgeSizes.identity}
    });
  }

}

Dimensions.identity = 'layout.Dimensions';

/**
 * Register identities
 */
mozy.modelIdentities.set(Rect.identity,       Rect);
mozy.modelIdentities.set(EdgeSizes.identity,  EdgeSizes);
mozy.modelIdentities.set(Dimensions.identity, Dimensions);
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

const jsonStr = JSON.stringify(dim);
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
const data = JSON.parse(jsonStr);
const model = mozy.modelRegistry.getModel(data);
console.log(model.padding.right) // 10
```


## Test

(WIP)

```sh
npm test
```


## Changelog

### 0.5.0
* Renamed getModelData to getDeepClonedModelData for clarity.
* Replaced usage of (previous) getModelData with getDataReference some places where deep cloning was unnecessary.
* Added assigning of previous data in Model.assignData (issue #6).
* Dependency updates.

### 0.4.0
* Bugfix for Issue #2: “Bug: copy replaces identical ...”
* Removed flag to preserve uuids in Model.copy.
* Fixed tests for Model.copy.
* Dev dependency updates.
* Lint fixes.

### 0.3.0
* Issue #2: “Bug: copy replaces identical uuids with different uuids, destroying internal references”
* Flag to preserve uuids in Model.copy.
* Tests for Model.copy.
* Dev env config and dependency updates (eslint, babel, nyc).

### 0.2.2
* Factory test fixes.
* toJSON method for model.

### 0.2.0
* Switched indentation from 4 spaces to 2.
* Merged ModelRegistry and Registry into Registry.
* Model:
  - Rewrite (simplified).
  - Now extends npm:wolfy87-eventemitter instead of npm:events.
* Factory:
  - Removed dependencies.
* Tests
  - More tests.
  - Replaced istanbul coverage with nyc.


## License

This software is licensed under the [MIT License](https://github.com/insector-ab/mozy/blob/master/LICENSE).
