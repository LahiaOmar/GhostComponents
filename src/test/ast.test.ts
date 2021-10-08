import {fileASTparser} from '../helpers/parser'

describe("TESTING AST PARSER", () => {
  it("should create a ast tree from js code", () => {
    const stringCode = `
    import defImp, { Route as Routes, Switch } from './react-router-dom'
    <>
    <App.app />
    <Container />
    </>
    const name = "omar"
    `

    const {importStatement, exportStatements, JSXtags} = fileASTparser(stringCode, {})
    
    
  })
})