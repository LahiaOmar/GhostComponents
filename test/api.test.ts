import { Api } from "../src/api";
import path from 'path'

describe("API TESTING", () => {
  it("should show", async () => {
    const rootFolder = "/test/mock/reactjs-todo-list/src";
    const entryPoint = "/test/mock/reactjs-todo-list/src/index.js";
    const api = new Api(rootFolder, entryPoint, [])
    
    const ghost = await api.searchGhost()
  
    expect(ghost).toContain(path.join(process.cwd(), '/test/mock/reactjs-todo-list/src/component/Item.js'
    ))
  })
})