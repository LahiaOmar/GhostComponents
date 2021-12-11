import Api from "../src/api";
import path from "path";

describe("API TESTING", () => {
  it("should detect Item component as GHOST (unused)", async () => {
    const rootFolder = "/test/mock/reactjs-todo-list/src";
    const entryPoint = "/test/mock/reactjs-todo-list/src/index.js";
    const api = new Api({ rootFolder, entryPoint });

    await api.initAPI();
    const { ghosts } = await api.searchGhost();

    expect(ghosts).toContainEqual({
      name: "Item",
      path: path.join(
        process.cwd(),
        "/test/mock/reactjs-todo-list/src/component/Item.js"
      ),
    });
  });

  it("should parse jsconfig.json for ModuleAliases", async () => {
    try {
      const rootFolder = "/test/mock/reactjs-todo-list/";
      const entryPoint = "/test/mock/reactjs-todo-list/src/index.js";
      const api = new Api({ rootFolder, entryPoint });

      await api.initAPI();

      const source = await api.resolveSourceImport(
        "/home/lahiaomar/Documents/projects/Libs/GhostComponents/test/mock/reactjs-todo-list/src/component/Done.js",
        "src/component/Header/"
      );

      expect(source).toBe("../Header");
    } catch (ex) {
      console.log("test  ex", ex);
    }
  });
});
