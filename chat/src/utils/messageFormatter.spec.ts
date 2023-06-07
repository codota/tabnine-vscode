import { getMessageSegments } from "./messageFormatter";

describe("Test getMessageSegments", () => {
  test("renders learn react link", () => {
    const result = getMessageSegments(`
    Some text with 'highlight' and also a **bold** text
    ${"```"}javascript
    const a = 1;
    const b = 2;
    ${"```"}
    and also these bullets:
    - bullet 1
    - bullet 2
    and this is the end
    `);
    console.log(result);
  });

  test.only("", () => {
    const result = getMessageSegments(`Sure, here are some attributes of the SOLID acronym:

- It is an acronym that represents five principles of object-oriented programming and design.
- It is a mnemonic for five design principles that are intended to make software design more maintainable, flexible, and scalable.
- The **SOLID** acronym was created by Robert C. Martin, a software developer and author of the book "Object-Oriented Software Construction."
- The **SOLID** principles were introduced by Michael Feathers, a software developer and author of the book "Agile Software Development: Principles, Patterns, and Practices."
- The **SOLID** principles are intended to make software design more understandable, flexible, and maintainable by focusing on the following five design principles:

Here is some code example
${"```"}javascript
const a = 1;
const b = 2;
${"```"}

There are another bullets

- Single Responsibility Principle (SRP): A class should have only one reason to change, meaning that a class should have only one responsibility.
- Open/Closed Principle (OCP): Software entities should be open for extension but closed for modification. This means that you should be able to extend the behavior of a class without modifying its source code.
- Liskov Substitution Principle (LSP): Subtypes must be substitutable for their base types. This means that if a parent class can be used where a child class is expected, then an object of the child class can be used in place of an object of the parent class without affecting the correctness of the program.
- Interface Segregation Principle (ISP): Clients should not be forced to depend on interfaces they do not use. This means that a class should not be required to implement interfaces it does not need.
- Dependency Inversion Principle (DIP): High-level modules should not depend on low-level modules. Both should depend on abstractions. This means that you should depend on abstractions, not on concrete implementations.

By **following** these 'principles', you 'can create' more maintainable and scalable code that is easier to test and debug.`);
    console.log(result);
  });
});
