export type Constructor<T> = new (...args: any[]) => T;
export type AbstractConstructor<T> = abstract new (...args: any[]) => T;
export type DependencyKey<T> = AbstractConstructor<T> | Constructor<T>;

export interface Registration {
    creator: Constructor<any>;
    isSingleton: boolean;
}