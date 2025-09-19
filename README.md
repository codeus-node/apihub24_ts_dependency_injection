[![npm version](https://badge.fury.io/js/@apihub24%2Fts_dependency_injection.svg?icon=si%3Anpm)](https://badge.fury.io/js/@apihub24%2Fts_dependency_injection)
[![License: Apache2.0](https://img.shields.io/badge/License-Apache2.0-green.svg)](https://opensource.org/licenses/Apache2.0)
[![CI](https://github.com/codeus-node/apihub24_ts_dependency_injection/actions/workflows/ci.yml/badge.svg)](https://github.com/codeus-node/apihub24_ts_dependency_injection/actions/workflows/ci.yml)
[![Codecov](https://codecov.io/gh/codeus-node/apihub24_ts_dependency_injection/branch/main/graph/badge.svg)](https://codecov.io/gh/codeus-node/apihub24_ts_dependency_injection)

# Typescript Dependency Injection

This project provides a lightweight and flexible dependency injection (DI) container for TypeScript applications. It simplifies the management of class dependencies, making your code more modular, testable, and maintainable. The container supports transient services, singletons, and constructor-based dependency resolution.

## Features

- Dependency Resolution: Automatically resolves and injects class dependencies through the constructor.
- Scoped Services: Register services under different keys to create distinct application contexts (e.g., global, test).
- Singletons: Easily manage services that should only have one instance throughout their lifecycle.
- Testing Support: The replaceWith function allows you to quickly mock dependencies for unit testing.
- Minimalistic: A small and easy-to-understand codebase.

## Installation

To use this container in your project, you'll need to install the reflect-metadata package, which is required for dependency resolution via decorators.

```bash
npm install --save @apihub24/ts_dependency_injection
```

Make sure to enable emitDecoratorMetadata and experimentalDecorators in your tsconfig.json file.

```json
{
  "compilerOptions": {
    "target": "es2017",
    "module": "commonjs",
    "lib": ["es2017"],
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

## Usage

1. Registering Services

   Use the provided decorators to register your classes with the container.

Basic Service (Singleton)

A service creates a new instance every time it's injected when the instance not exists.

```ts
import { Service, inject } from "@apihub24/ts_dependency_injection";

// register a Singleton Logger
@Service()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

// inject the Logger Instance
const logger = inject(Logger);
```

Abstraction to Implementation

Register a concrete implementation for an abstract class or interface. This is a common pattern for writing testable code.

```ts
import { ServiceFor, inject } from "@apihub24/ts_dependency_injection";

abstract class AuthService {
  abstract login(): void;
}

@ServiceFor(AuthService)
class BasicAuthService extends AuthService {
  login() {
    console.log("Logging in with basic authentication...");
  }
}

const authService = inject(AuthService);
authService.login();
```

Use Scoped Service

Pass some string to Scope the Service so you can have Multiple Instances of a Abstract Service. This can be used for Service Decorator also.

```ts
import { ServiceFor, inject, destroy } from "@apihub24/ts_dependency_injection";

abstract class AuthService {
  abstract login(): void;
}

@ServiceFor(AuthService, "1")
class AuthService1 extends AuthService {
  login() {
    console.log("Logging in with basic authentication...");
  }
}

@ServiceFor(AuthService, "2")
class AuthService2 extends AuthService {
  login() {
    console.log("Logging in with basic authentication...");
  }
}

const authService1 = inject(AuthService, "1");
const authService2 = inject(AuthService, "2");

// Be sure to Destroy the Instances when not used anymore!!!!
destroy(AuthService, "1");
destroy(AuthService, "2");
```

2. Constructor Injection

   The container automatically resolves and provides dependencies to a class's constructor.

```ts
import { ServiceFor, inject } from "@apihub24/ts_dependency_injection";

@Service()
class Engine {}

@Service()
class Car {
  constructor(private engine: Engine) {}
}

const car = inject(Car);
console.log(car instanceof Car); // true
console.log(car.engine instanceof Engine); // true
```

If you want Inject a scoped Service use the @Inject Decorator.

```ts
import { ServiceFor, inject } from "@apihub24/ts_dependency_injection";

abstract class Engine {}
@ServiceFor(Engine, "petrol")
class PetrolEngine implements Engine {}
@ServiceFor(Engine, "electro")
class ElectroEngine implements Engine {}

@Service()
class ElectroCar {
  constructor(@Inject("electro") private engine: Engine) {}
}

@Service()
class PetrolCar {
  constructor(@Inject("petrol") private engine: Engine) {}
}

@Service()
class HybridCar {
  constructor(
    private electroEngine: ElectroEngine,
    private petrolEngine: PetrolEngine
  ) {}
}

const car1 = inject(ElectroCar);
const car2 = inject(PetrolCar);
const car3 = inject(HybridCar);

console.log(car1 instanceof ElectroCar); // true
console.log(car1.engine instanceof ElectroEngine); // true

console.log(car2 instanceof PetrolCar); // true
console.log(car2.engine instanceof PetrolEngine); // true

console.log(car3 instanceof ElectroCar); // true
console.log(car3.electroEngine instanceof ElectroEngine); // true
console.log(car3.petrolEngine instanceof PetrolEngine); // true
```

3. Testing and Mocking

   Use replaceWith to substitute a dependency's implementation for testing purposes.

```ts
import { ServiceFor, inject } from "@apihub24/ts_dependency_injection";

// Production Service
abstract class DatabaseService {
  abstract query(): string;
}

@ServiceFor(DatabaseService)
class MySQLService extends DatabaseService {
  query() {
    return "Querying MySQL...";
  }
}

// A mock service for testing
class MockDatabaseService extends DatabaseService {
  query() {
    return "Mocking the database...";
  }
}

// In your test:
replaceWith(DatabaseService, MockDatabaseService);

const dbService = inject(DatabaseService);
console.log(dbService.query()); // "Mocking the database..."
```
