import "reflect-metadata";
import {AbstractConstructor, Constructor, DependencyKey, Registration} from "./types";

const registrations = new Map<string, Map<DependencyKey<any>, Registration>>();
const singletons = new Map<string, Map<DependencyKey<any>, any>>();
const globalIdentifier = "#global#";

function registerCreator<T>(
    abstractTarget: DependencyKey<T>,
    concreteCreator: Constructor<T>,
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


export function Service<T>(key: string = globalIdentifier) {
    return function (concreteCreator: Constructor<T>) {
        registerCreator(concreteCreator, concreteCreator, key, key === globalIdentifier);
    }
}

export function ServiceFor<T>(abstractTarget: AbstractConstructor<T>, key: string = globalIdentifier) {
    return function (concreteCreator: Constructor<T>) {
        registerCreator(abstractTarget, concreteCreator, key, key === globalIdentifier);
    }
}

export function inject<T>(target: DependencyKey<T>, key: string = globalIdentifier): T {
    const registration = registrations.get(key)?.get(target);

    if (!registration) {
        throw new Error(`Dependency not found for type: ${target.name} in key: ${key}`);
    }

    let instances = singletons.get(key);
    if (!instances) {
        instances = new Map();
        singletons.set(key, instances);
    }
    let instance = instances.get(target);
    if (!instance) {
        const constructorParams = Reflect.getMetadata("design:paramtypes", registration.creator) || [];
        const dependencies = constructorParams.map((param: any) => inject(param, key));
        instance = new registration.creator(...dependencies);
        instances.set(target, instance);
    }

    return instance;
}

export function replaceWith<T>(abstractTarget: AbstractConstructor<T>, concreteCreator: Constructor<T>, key: string = globalIdentifier) {
    ServiceFor(abstractTarget, key)(concreteCreator);
    const instances = singletons.get(key);
    if (!instances) {
        return;
    }
    instances.delete(abstractTarget);
    instances.set(abstractTarget, inject(abstractTarget));
}