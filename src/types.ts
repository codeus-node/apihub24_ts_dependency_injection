/**
 * Represents a generic constructor type.
 *
 * This utility type is used to define a class constructor signature
 * where a class can be instantiated with the `new` keyword, taking any
 * number of arguments and returning an instance of type `T`.
 *
 * @template T The type of the instance created by the constructor.
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * Represent a generic Factory Function type.
 *
 * @template T The type of the instance created by the constructor.
 */
export type FactoryFunction<T> = (...args: any[]) => T;

/**
 * A type alias representing an abstract constructor signature that can be used
 * as a base class or to define abstract class-like behavior in TypeScript.
 *
 * `AbstractConstructor` is used to describe abstract classes that cannot
 * be directly instantiated, but can be extended and implemented by other classes.
 *
 * @template T The type of the class or object instance that this constructor produces.
 */
export type AbstractConstructor<T> = abstract new (...args: any[]) => T;

/**
 * Represents a type used as a key for dependency injection.
 *
 * A `DependencyKey` can be either an `AbstractConstructor` or a `Constructor`.
 * This type is utilized to identify dependencies in a type-safe manner
 * within dependency injection frameworks or patterns.
 *
 * @template T - The type associated with the dependency key.
 */
export type DependencyKey<T> = AbstractConstructor<T> | Constructor<T>;

/**
 * Represents the registration details of a component or service in a dependency injection system.
 *
 * This interface is designed to hold the information required to register a class or constructor,
 * along with its instantiation behavior.
 *
 * Properties:
 * - `creator`: Specifies the constructor function of the class or service being registered.
 * - `isSingleton`: Indicates whether the same instance of the registered class or service should
 *   be reused (singleton behavior).
 */
export interface Registration {
  creator: Constructor<any> | FactoryFunction<any>;
  isSingleton: boolean;
}
