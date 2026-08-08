/**
 * Compile-time conformance check for the published typings. Imports the
 * package through its own exports map (package self-reference resolves
 * "mozy" to dist/esm + dist/types) and touches every public export, so a
 * drift between the hand-authored declarations and the entrypoint fails
 * `npm run check:package`. Requires `npm run build` first.
 */
import mozy, {
  Model,
  Factory,
  Registry,
  ALLOW_OVERRIDES,
  DONT_ALLOW_OVERRIDES,
  InvalidRegistryKeyError,
  modelIdentities,
  modelFactory,
  modelRegistry
} from 'mozy';
import type {
  ModelData,
  SetOptions,
  AssignOptions,
  RegistryOptions,
  ModelConstructor
} from 'mozy';

// Named and default exports must agree.
const defaultExport: {
  Model: typeof Model;
  Factory: typeof Factory;
  Registry: typeof Registry;
  ALLOW_OVERRIDES: typeof ALLOW_OVERRIDES;
  DONT_ALLOW_OVERRIDES: typeof DONT_ALLOW_OVERRIDES;
  InvalidRegistryKeyError: typeof InvalidRegistryKeyError;
  modelIdentities: typeof modelIdentities;
  modelFactory: typeof modelFactory;
  modelRegistry: typeof modelRegistry;
} = mozy;

// Model surface
const model: Model = new Model({ foo: 1 });
const copied: Model = model.copy();
const data: ModelData = model.getDataReference();
const cloned: ModelData = model.getDeepClonedModelData();
const identity: string | undefined = model.getModelIdentity();
const uuid: string | undefined = model.uuid;
const setOptions: SetOptions = { setSilent: true, unsetIfFalsy: true };
const assignOptions: AssignOptions = { setSilent: true };
model
  .set('foo', 2, setOptions)
  .toggle('flag')
  .unset('foo')
  .assignData({ bar: 3 }, assignOptions)
  .resetData({ baz: 4 })
  .dispatchChange('bar', 3, undefined)
  .addEventListener('change', () => undefined)
  .dispose();
const changed: boolean = model.hasChanged('bar');
const staticIdentity: string = Model.identity;

// Factory surface
const factory: Factory = new Factory(modelIdentities);
const Ctor: ModelConstructor | undefined = factory.getConstructor(Model.identity);
const known: boolean = factory.isKnownIdentity(Model.identity);

// Registry surface
const registryOptions: RegistryOptions = {
  keyAttr: 'uuid',
  allowOverrides: ALLOW_OVERRIDES,
  keyValidator: (key: unknown): boolean => typeof key === 'string'
};
const registry: Registry = new Registry(factory, registryOptions);
registry.register(model, 'conformance-key');
const removed: boolean = registry.unregister(model, 'conformance-key');
const multiton: Registry = Registry.get('conformance', modelFactory);
const registryError: InvalidRegistryKeyError = new InvalidRegistryKeyError('bad key');
const strictDefault: typeof DONT_ALLOW_OVERRIDES = false;

// Reference everything so no import can silently go unused.
export default {
  defaultExport,
  copied,
  data,
  cloned,
  identity,
  uuid,
  changed,
  staticIdentity,
  Ctor,
  known,
  removed,
  multiton,
  modelRegistry,
  registryError,
  strictDefault
};
