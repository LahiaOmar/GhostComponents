import { Api } from "../api";
import path from 'path'
import Cli from "../cli";

describe("API TESTING", () => {
  it("should show", async () => {
    const rootFolder = "src/test/mock/reactjs-todo-list/src";
    const entryPoint = "src/test/mock/reactjs-todo-list/src/index.js";
    const api = new Api(rootFolder, entryPoint, [])
    
    const ghost = await api.searchGhost()
  
    expect(ghost).toContain(path.join(process.cwd(), '/src/test/mock/reactjs-todo-list/src/component/Item.js'
    ))
  })
})