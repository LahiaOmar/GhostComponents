import { AstParser, Component } from "../src/parser";
import { readFile } from "../src/helpers/fs";

declare global {
  namespace jest {
    interface Matchers<R> {
      toContainComponent(arrayComponent: string[]): R;
    }
  }
}

expect.extend({
  toContainComponent(received: Component[], arrayComponent: string[]) {
    const notFoundComponent: string[] = [];

    arrayComponent.forEach((componentName) => {
      const found = received.find(({ info }) => info.name === componentName);
      if (!found) {
        notFoundComponent.push(componentName);
      }
    });
    const pass = notFoundComponent.length === 0;

    if (pass) {
      return {
        message: () => `All component is founded`,
        pass: true,
      };
    } else {
      return {
        message: () => `Those components are not found :${notFoundComponent}`,
        pass: false,
      };
    }
  },
});

describe("TESTING AST PARSER", () => {
  test("should parse the 3 types of react components [FUNC, CLASS, ARROW] ", async () => {
    const filePath = "./test/mock/single-component/all-types-components.js";
    const fileContent = await readFile(filePath);
    const astParser = new AstParser();
    const expectedComponents = [
      "ClassComponent",
      "FunctionComponent",
      "arrowFunctionComponent",
    ];

    const { components } = astParser.parse(fileContent);

    expect(components).toContainComponent(expectedComponents);
  });
});
