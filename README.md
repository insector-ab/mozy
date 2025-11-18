# mozy &middot; [![GitHub license](https://img.shields.io/github/license/insector-ab/mozy.svg)](https://github.com/insector-ab/mozy/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/mozy.svg?style=flat)](https://www.npmjs.com/package/mozy) ![Coverage Status](https://img.shields.io/badge/Coverage%20(lines)-96%25-brightgreen.svg)
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

### Listening to changes

Models extend EventEmitter, so you can subscribe to property-specific events or the generic `change` event:

```javascript
const rect = new Rect();

rect.addEventListener('change width', (eventType, sender, newValue, oldValue) => {
  console.log(`Width changed from ${oldValue} to ${newValue}`);
});

rect.addEventListener('change', () => {
  console.log('Any property changed');
});

rect.toggle('selected');      // Convenience helper for booleans
rect.unset('height');         // Removes the property entirely
rect.resetData({ width: 10 }); // Resets while preserving identity/uuid
rect.dispose();               // Removes listeners and references
```

### Advanced registry usage

Registries support custom key extractors, override policies, and multitons:

```javascript
import mozy from 'mozy';

const registry = new mozy.Registry(mozy.modelFactory, {
  keyAttr: data => `custom-${data.uuid}`,
  keyValidator: key => key.startsWith('custom-'),
  allowOverrides: mozy.ALLOW_OVERRIDES
});

const rect = new Rect();
registry.register(rect);

// Shared registries without manual plumbing
const shared = mozy.Registry.get('shared-rects', mozy.modelFactory);
shared.register(rect);
```

`Registry.get(name, factory)` returns the same registry per name, making it easy to share caches or singletons between modules.


## Test

```sh
npm test
```

The test script runs the Mocha suite through Babel and reports coverage via V8's built-in instrumentation (`c8`), emitting both text and lcov output. The suite targets >90% line coverage, including edge cases around the Registry and Factory helpers.

## Build

Compiled artifacts now live in `dist/`:

- `npm run build` cleans the folder and emits both CommonJS (`dist/cjs`) and ESM (`dist/esm`) bundles via Babel.
- `npm run watch` rebuilds the CommonJS bundle on change for local development.
- Type declarations are generated via `npm run build:types` (also part of `npm run build`) and published under `dist/types`.
- Source maps are emitted inline for both bundles to simplify downstream debugging.

The package `exports` map points Node's `import` consumers at `dist/esm/index.js` and `require` callers at `dist/cjs/index.js`, so publishing only requires `npm publish` (the `prepare` script runs the build automatically).

For local releases, run `npm run release` to execute lint, tests (with coverage), and the full build in a single command before publishing.

## TypeScript

First-party typings live under `dist/types/index.d.ts` and are generated from the hand-authored `types/` source via `npm run build:types`. Consumers can rely on the `types` field in `package.json` without installing community-maintained definitions.


## Changelog

### Unreleased
**Empty**

### 0.6.3 – 2025-11-18
* Forced all direct and transitive consumers onto `glob@^11.1.0` through npm overrides and pinned `test-exclude` to the last compatible `glob@7` branch so coverage tasks keep running on Node 22.
* Regenerated the lockfile after running `npm audit fix` to ensure the patched dependency graph still passes `npm run build` and `npm test`.

### 0.6.2 – 2025-11-15
* Patched the `js-yaml` advisory by adding an explicit `^4.1.1` dependency and trimming the duplicate vulnerable copies that npm hoisted into the lockfile.

### 0.6.1 – 2025-11-14
* Expanded the published TypeScript declarations: `Model` now exposes its protected helpers, backing data references, and flags, and the exported identity map is renamed to `modelIdentities` for consistency.

### 0.6.0 – 2025-11-13
* Replaced `wolfy87-eventemitter`, `lodash.clonedeep`, and `lodash.isplainobject` with maintained or native alternatives to shrink the runtime surface.
* Upgraded to `uuid@13` and now rely on its built-in helpers for UUID generation and validation.
* Added TypeScript declaration output, CI + coverage automation, and broadened Factory/Registry tests to maintain >90% line coverage.
* Dropped all `@ts-nocheck` directives and annotated `Model`, `Factory`, `Registry`, and the entrypoint with full JSDoc types so editors catch missing uuid/identity fields and event signatures out of the box.
* Hoisted UUID regexes, removed `Object.keys().forEach` allocations in default handling, cached `structuredClone`, and memoized registry key getters to shave allocations off hot paths like `Model.copy()` and `Registry.getModel()`.
* Simplified distribution to ESM-only output (with first-party types) and inlined the tiny `es6-error` helper to keep install size minimal for internal consumers.
* Skipped redundant change events and reused registry keys; local Node 22 microbenchmarks show `getModel` (~100k ops) in ~0.70s, `toggle` (~100k ops) in ~0.03s, and `resetData` (~10k ops) in ~0.007s.

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
