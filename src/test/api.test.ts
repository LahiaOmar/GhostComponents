import { Api } from "../api";
import path from 'path'

describe("API TESTING", () => {
  it("should show", async () => {
    const rootFolder = "src/test/mock/reactjs-todo-list/src";
    const entryPoint = "src/test/mock/reactjs-todo-list/src/App.js";
    const api = new Api(rootFolder, entryPoint, [])
    
    const ghost = await api.searchGhost()
    console.log({ghost})
    expect(ghost).toContain(path.join(process.cwd(), '/src/test/mock/reactjs-todo-list/src/component/Item.js'
    ))
  })
})