import {inject, replaceWith, Service, ServiceFor} from "../src";

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
        abstract sub(n1: number, n2: number): number;
    }
    @ServiceFor(SubService, "forward")
    class SubForwardService implements SubService {
        sub(n1: number, n2: number): number {
            return n1 - n2;
        }
    }

    @ServiceFor(SubService, "reverse")
    class SubReverseService implements SubService  {
        sub(n1: number, n2: number): number {
            return n2 - n1;
        }
    }

    class NotRegistered implements SubService {
        sub(n1: number, n2: number): number {
            return 0;
        }
    }

    class RegisteredLater implements SubService {
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
});