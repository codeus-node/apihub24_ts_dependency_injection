import {
  destroy,
  Inject,
  inject,
  replaceWith,
  Service,
  ServiceFor,
} from "../src";
import { Constructor } from "./types";

describe("DependencyInjection Tests", () => {
  abstract class Greeter {
    abstract greet(name: string): string;
  }

  @ServiceFor(Greeter)
  class GreeterService implements Greeter {
    greet(name: string): string {
      return `Hello, ${name}`;
    }
  }

  class MockGreeterService implements Greeter {
    greet(name: string): string {
      return "Mock";
    }
  }

  @Service()
  class AddService {
    add(n1: number, n2: number): number {
      return n1 + n2;
    }
  }

  class MockAddService {
    add(n1: number, n2: number): number {
      return 5;
    }
  }

  abstract class SubService {
    abstract counter: number;
    abstract sub(n1: number, n2: number): number;
    abstract count(): void;
  }
  @ServiceFor(SubService, "forward")
  class SubForwardService implements SubService {
    counter = 0;
    count() {
      this.counter++;
    }
    sub(n1: number, n2: number): number {
      return n1 - n2;
    }
  }

  @ServiceFor(SubService, "reverse")
  class SubReverseService implements SubService {
    counter = 0;
    count() {
      this.counter++;
    }
    sub(n1: number, n2: number): number {
      return n2 - n1;
    }
  }

  class NotRegistered implements SubService {
    counter = 0;
    count() {
      this.counter++;
    }
    sub(n1: number, n2: number): number {
      return 0;
    }
  }

  class RegisteredLater implements SubService {
    counter = 0;
    count() {
      this.counter++;
    }
    sub(n1: number, n2: number): number {
      return 1;
    }
  }

  type Fuel = "petrol" | "diesel" | "electro" | "gas";

  abstract class Engine {
    abstract fuel: Fuel;
    abstract fill(): void;
  }

  @ServiceFor(Engine, "electro")
  @Service()
  class ElectroEngine implements Engine {
    fuel: Fuel = "electro";
    fill(): void {}
  }

  @ServiceFor(Engine, "petrol")
  @Service()
  class PetrolEngine implements Engine {
    fuel: Fuel = "petrol";
    fill(): void {}
  }

  @ServiceFor(Engine, "diesel")
  @Service()
  class DieselEngine implements Engine {
    fuel: Fuel = "diesel";
    fill(): void {}
  }

  @ServiceFor(Engine, "gas")
  @Service()
  class GasEngine implements Engine {
    fuel: Fuel = "gas";
    fill(): void {}
  }

  @Service()
  class HybridCar {
    get fuels() {
      return [this.engine1.fuel, this.engine2.fuel];
    }
    constructor(
      @Inject("petrol")
      public engine1: Engine,
      @Inject("electro")
      public engine2: Engine
    ) {}
  }
  @Service()
  class PetrolCar {
    get fuel() {
      return this.engine.fuel;
    }
    constructor(public engine: PetrolEngine) {}
  }
  @Service()
  class DieselCar {
    get fuel() {
      return this.engine.fuel;
    }
    constructor(public engine: DieselEngine) {}
  }

  @Service()
  class GasCar {
    get fuel() {
      return this.engine.fuel;
    }
    constructor(
      @Inject("gas")
      public engine: Engine
    ) {}
  }

  abstract class FakeServiceBase {
    text?: string;
  }
  class FakeService implements FakeServiceBase {
    text = "fake";
  }

  it("should throw Error when not registered", () => {
    try {
      inject(NotRegistered);
      expect(true).toBe(false);
    } catch (e) {
      expect((e as Error).message).toBe(
        "Dependency not found for type: NotRegistered in key: #global#"
      );
    }
  });

  it("should inject", () => {
    const greeterService = inject(Greeter);
    expect(greeterService.greet("Markus")).toBe("Hello, Markus");
  });

  it("should overwrite with abstract target", () => {
    replaceWith(Greeter, MockGreeterService);
    const greeterService = inject(Greeter);
    expect(greeterService.greet("Markus")).toBe("Mock");
  });

  it("should get scoped services", () => {
    const forwardSubService = inject(SubService, "forward");
    const reverseSubService = inject(SubService, "reverse");
    expect(forwardSubService.sub(2, 1)).toBe(1);
    expect(reverseSubService.sub(1, 3)).toBe(2);
  });

  it("should register when replace Service", () => {
    replaceWith(SubService, RegisteredLater, "one");
    const registeredLaterService = inject(SubService, "one");
    expect(registeredLaterService.sub(0, 0)).toBe(1);
  });

  it("should cleanup Scoped Services", () => {
    const registeredLaterService = inject(SubService, "one");
    registeredLaterService.count();
    expect(registeredLaterService.counter).toBe(1);
    destroy(SubService, "one");
    const registeredLaterService2 = inject(SubService, "one");
    expect(registeredLaterService2.counter).toBe(0);
  });

  it("should replace global Services", () => {
    const addService = inject(AddService);
    expect(addService.add(1, 1)).toBe(2);
    replaceWith(AddService, MockAddService);
    expect(inject(AddService).add(1, 1)).toBe(5);
  });

  it("should inject arguments", () => {
    const petrolCar = inject(PetrolCar);
    const dieselCar = inject(DieselCar);
    expect(petrolCar).toBeDefined();
    expect(petrolCar.fuel).toBe("petrol");
    expect(petrolCar.engine).toBeInstanceOf(PetrolEngine);
    expect(dieselCar).toBeDefined();
    expect(dieselCar.fuel).toBe("diesel");
    expect(dieselCar.engine).toBeInstanceOf(DieselEngine);
  });

  it("should inject abstract variations", () => {
    const gasCar = inject(GasCar);
    expect(gasCar).toBeDefined();
    expect(gasCar.fuel).toBe("gas");
    expect(gasCar.engine).toBeInstanceOf(GasEngine);
  });

  it("should inject multiple parameters", () => {
    const hybridCar = inject(HybridCar);
    expect(hybridCar).toBeDefined();
    expect(hybridCar.fuels).toStrictEqual(["petrol", "electro"]);
    expect(hybridCar.engine1).toBeInstanceOf(PetrolEngine);
    expect(hybridCar.engine2).toBeInstanceOf(ElectroEngine);
  });

  it("should fake constructor", () => {
    replaceWith(FakeServiceBase, new FakeService());
    const fake = inject(FakeServiceBase);
    expect(fake).toBeDefined();
    expect(fake.text).toBe("fake");
  });
});
