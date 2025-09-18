import {destroy, inject, replaceWith, Service, ServiceFor} from "../src";

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
            return n1+n2;
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
        abstract count();
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
    class SubReverseService implements SubService  {
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

    it("should throw Error when not registered", () => {
        try {
            inject(NotRegistered);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe("Dependency not found for type: NotRegistered in key: #global#");
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
        expect(forwardSubService.sub(2,1)).toBe(1);
        expect(reverseSubService.sub(1,3)).toBe(2);
    });

    it("should register when replace Service", () => {
        replaceWith(SubService, RegisteredLater, "one");
        const registeredLaterService = inject(SubService, "one");
        expect(registeredLaterService.sub(0,0)).toBe(1);
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
});