import { suite, it } from "mocha";
import { expect } from "chai";
import { toCamelCase, toSnakeCase } from "../../utils/string.utils";

suite("string utils", () => {
  it("converts camel case to snake case", () => {
    expect(toSnakeCase("")).equals("");
    expect(toSnakeCase("kakiPipi")).equals("kaki_pipi");
    expect(toSnakeCase("KakiPipi")).equals("kaki_pipi");
    expect(toSnakeCase("Kaki")).equals("kaki");
    expect(toSnakeCase("KAki")).equals("kaki");
    expect(toSnakeCase("kaki")).equals("kaki");
  });

  it("converts snake case to camel case", () => {
    expect(toCamelCase("")).equals("");
    expect(toCamelCase("kaki_pipi")).equals("kakiPipi");
    expect(toCamelCase("kaki")).equals("kaki");
    expect(toCamelCase("")).equals("");
  });

  it("doesn't change the text when converting snake case to snake case", () => {
    expect(toSnakeCase("")).equals("");
    expect(toSnakeCase("kaki_pipi")).equals("kaki_pipi");
    expect(toSnakeCase("kaki")).equals("kaki");
  });

  it("doesn't change the text when converting camel case to camel case", () => {
    expect(toCamelCase("")).equals("");
    expect(toCamelCase("kakiPipi")).equals("kakiPipi");
    expect(toCamelCase("KakiPipi")).equals("KakiPipi");
    expect(toCamelCase("Kaki")).equals("Kaki");
    expect(toCamelCase("kaki")).equals("kaki");
  });
});
