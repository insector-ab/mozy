import type EventEmitter from 'eventemitter3';

export type ModelData = Record<string, any>;

export interface SetOptions {
  setSilent?: boolean;
  unsetIfFalsy?: boolean;
}

export interface AssignOptions {
  setSilent?: boolean;
}

export declare class Model extends EventEmitter {
  constructor(data?: ModelData, ...args: any[]);

  static identity: string;

  get uuid(): string | undefined;
  getModelIdentity(): string | undefined;
  getDeepClonedModelData(): ModelData;
  toJSON(): ModelData;
  getDataReference(): ModelData;
  get<T = any>(property: string, defaultValue?: T): T | undefined;
  getPrevious<T = any>(property: string): T | undefined;
  has(property: string): boolean;
  hasChanged(...properties: string[]): boolean;
  set(property: string, value: any, options?: SetOptions): this;
  toggle(property: string, options?: SetOptions): this;
  unset(property: string, options?: SetOptions): this;
  resetData(defaultData: ModelData, options?: AssignOptions): this;
  assignData(data: ModelData, options?: AssignOptions): this;
  copy(): this;
  dispatchEvent(eventType: string, ...args: any[]): this;
  dispatchChange(property?: string, newValue?: any, oldValue?: any): this;
  addEventListener(event: string, listener: (...args: any[]) => void): this;
  removeEventListener(event: string, listener: (...args: any[]) => void): this;
  dispose(): this;
}

export type ModelConstructor<T extends Model = Model> = new (...args: any[]) => T;

export declare class Factory {
  constructor(
    constructorMap: Record<string, ModelConstructor> | Map<string, ModelConstructor>,
    identityGetter?: string | ((obj: ModelData) => string | undefined)
  );

  getIdentityOf(obj: ModelData): string | undefined;
  requireIdentityOf(obj: ModelData): string;
  hasIdentityDefined(obj: ModelData): boolean;
  isKnownIdentity(identity: string): boolean;
  getConstructor(identity: string): ModelConstructor | undefined;
  requireConstructor(identity: string): ModelConstructor;
  getConstructorFor(obj: ModelData): ModelConstructor | undefined;
  requireConstructorFor(obj: ModelData): ModelConstructor;
  newInstance<T extends Model>(identity: string, ...args: ConstructorParameters<ModelConstructor<T>>): T;
  newInstanceFor<T extends Model>(obj: ModelData): T;
}

export interface RegistryOptions {
  keyAttr?: string | ((this: Registry, data: ModelData) => string);
  allowOverrides?: boolean;
  keyValidator?: (key: any) => boolean;
  map?: Map<string, Model>;
}

export declare class Registry {
  constructor(factory: Factory | ((data: ModelData) => Model), options?: RegistryOptions);

  factory: Factory | ((data: ModelData) => Model);
  readonly options: RegistryOptions;

  getValidKeyIn(data: ModelData): string;
  getModel<T extends Model>(data: ModelData, Constructor?: ModelConstructor<T>): T;
  newInstanceFor<T extends Model>(data: ModelData): T;
  register(model: Model): this;
  unregister(model: Model): boolean;
  validate(key: any, value: Model): this;
  isValidKey(key: any): boolean;
  dataHasValidKey(data: ModelData): boolean;
  get<T extends Model>(key: string): T | undefined;
  set(key: string, value: Model): this;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  dispose(): void;

  static get(name: string, factory: Factory | ((data: ModelData) => Model), options?: RegistryOptions): Registry;
}

export declare const ALLOW_OVERRIDES: boolean;
export declare const DONT_ALLOW_OVERRIDES: boolean;
export declare class InvalidRegistryKeyError extends Error {}

export declare const identities: Map<string, typeof Model>;
export declare const modelFactory: Factory;
export declare const modelRegistry: Registry;

declare const mozy: {
  Model: typeof Model;
  Factory: typeof Factory;
  Registry: typeof Registry;
  modelIdentities: typeof identities;
  modelFactory: typeof modelFactory;
  modelRegistry: typeof modelRegistry;
};

export default mozy;
