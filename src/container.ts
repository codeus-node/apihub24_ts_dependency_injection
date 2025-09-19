import "reflect-metadata";
import {
  AbstractConstructor,
  Constructor,
  DependencyKey,
  FactoryFunction,
  Registration,
} from "./types";

const registrations = new Map<string, Map<DependencyKey<any>, Registration>>();
const singletons = new Map<string, Map<DependencyKey<any>, any>>();
const globalIdentifier = "#global#";

function registerCreator<T>(
  abstractTarget: DependencyKey<T>,
  concreteCreator: Constructor<T> | FactoryFunction<T>,
  key: string,
  isSingleton: boolean
) {
  let creators = registrations.get(key);
  if (!creators) {
    creators = new Map();
    registrations.set(key, creators);
  }
  creators.set(abstractTarget, { creator: concreteCreator, isSingleton });
}

/**
 * Parameter decorator to specify a custom DI key for a constructor parameter.
 * Stores the key in metadata for later resolution during injection.
 *
 * @param {string} key The DI context key to use for this parameter.
 * @returns A decorator function for constructor parameters.
 */
export function Inject(key: string) {
  return function (
    target: any,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    const existingKeys = Reflect.getMetadata("di:keys", target) || {};
    existingKeys[parameterIndex] = key;
    Reflect.defineMetadata("di:keys", existingKeys, target);
  };
}

/**
 * Service decorator function to register a concrete class for dependency injection.
 * This function associates a given class (constructor) with a specific key for later retrieval.
 *
 * @param {string} key The unique identifier for the associated concrete class. Defaults to a global identifier.
 * @return {Function} A decorator function that registers a concrete class using the specified key.
 */
export function Service<T>(key: string = globalIdentifier) {
  return function (concreteCreator: Constructor<T>) {
    registerCreator(
      concreteCreator,
      concreteCreator,
      key,
      key === globalIdentifier
    );
  };
}

/**
 * Registers a concrete class implementation for a given abstract class type with an optional key.
 *
 * @template T the Type of the Service Class to Register
 * @param {AbstractConstructor<T>} abstractTarget - The abstract class type to register.
 * @param {string} [key=globalIdentifier] - Optional identifier key for the registration. Defaults to a global identifier.
 * @return {Function} A function that associates the abstract type with a concrete class implementation.
 */
export function ServiceFor<T>(
  abstractTarget: AbstractConstructor<T>,
  key: string = globalIdentifier
) {
  return function (concreteCreator: Constructor<T>) {
    registerCreator(
      abstractTarget,
      concreteCreator,
      key,
      key === globalIdentifier
    );
  };
}

/**
 * Resolves and provides an instance of the specified dependency based on the given key.
 * Throws an error if the dependency is not registered for the provided key.
 *
 * @template T the Type of the Service Class to Register
 * @param {DependencyKey<T>} target - The dependency key used to look up the registration.
 * @param {string} [key=globalIdentifier] - The identifier for the dependency context. Defaults to `globalIdentifier`.
 * @return {T} An instance of the resolved dependency.
 */
export function inject<T>(
  target: DependencyKey<T>,
  key: string = globalIdentifier
): T {
  const registration = registrations.get(key)?.get(target);

  if (!registration) {
    throw new Error(
      `Dependency not found for type: ${target.name} in key: ${key}`
    );
  }

  let instances = singletons.get(key);
  if (!instances) {
    instances = new Map();
    singletons.set(key, instances);
  }
  let instance = instances.get(target);
  if (!instance) {
    const constructorParams =
      Reflect.getMetadata("design:paramtypes", registration.creator) || [];
    const scopedKeys =
      Reflect.getMetadata("di:keys", registration.creator) || {};
    const dependencies = constructorParams.map((param: any, index: number) => {
      const paramKey = scopedKeys[index] || key;
      return inject(param, paramKey);
    });

    if (
      typeof registration.creator === "function" &&
      registration.creator.prototype
    ) {
      instance = new (registration.creator as Constructor<T>)(...dependencies);
    } else {
      instance = (registration.creator as FactoryFunction<T>)(...dependencies);
    }
    instances.set(target, instance);
  }

  return instance;
}

/**
 * Replaces the specified abstract target class with a concrete implementation
 * for dependency injection, and updates the singleton instances accordingly.
 *
 * @template T the Type of the Service Class to Register
 * @param {AbstractConstructor<T>} abstractTarget - The abstract class to be replaced.
 * @param {Constructor<T> | T} concreteCreator - The concrete implementation to replace the abstract class with or an instance.
 * @param {string} [key=globalIdentifier] - An optional key to identify the dependency, defaults to a global identifier.
 * @return {void} No return value.
 */
export function replaceWith<T>(
  abstractTarget: AbstractConstructor<T>,
  concreteCreator: Constructor<T> | T,
  key: string = globalIdentifier
) {
  destroy(abstractTarget, key);
  if (typeof concreteCreator !== "function") {
    registerCreator(abstractTarget, () => concreteCreator, key, true);
  } else {
    registerCreator(
      abstractTarget,
      concreteCreator as Constructor<T>,
      key,
      true
    );
  }
  const instances = singletons.get(key);
  if (instances) {
    instances.set(abstractTarget, inject(abstractTarget, key));
  }
}

/**
 * Removes the specified target from the collection of instances associated with the given key.
 *
 * @template T the Type of the Service Class to Register
 * @param {DependencyKey<T>} target - The dependency key to be removed from the instances collection.
 * @param {string} [key=globalIdentifier] - An optional key used to identify the collection of instances. Defaults to a global identifier.
 * @return {void} Does not return any value.
 */
export function destroy<T>(
  target: DependencyKey<T>,
  key: string = globalIdentifier
) {
  const instances = singletons.get(key);
  if (!instances) {
    return;
  }
  instances.delete(target);
  if (instances.size < 1) {
    singletons.delete(key);
  }
}
