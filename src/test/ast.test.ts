import { AstParser } from '../helpers/parser'
import {Node} from '@babel/traverse'

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
    const astParser = new AstParser()

    const {importStatements, exportStatements, components} = astParser.parse(stringCode)
    
    // expect(JSXtags).toContain("App")
    // expect(JSXtags).toContain("Container")
  })

  it("ast parser class", () => {
    const code = `
    import React from 'react'
    import { Grid } from '@material-ui/core'
    import { Route, Switch } from 'react-router-dom'
    
    import './styles/style.css'
    
    import NavBar from './components/NavBar'
    import HeadLine from './components/HeadLine'
    import ProtectedRoute from './components/ProtectedRoute'
    import AlertMessage from './components/AlertMessage'
    import AlertProvider from './Context/AlertProvider'
    import AuthProvider from './Context/AuthProvider'
    import Dashboard from './components/Dashboard'
    import NotFound from './components/NotFound'
    
    function App() {
    
      return (
        <Grid
          container
          className="app-container"
          xs={12}>
          <AuthProvider>
            <AlertProvider>
              <AlertMessage />
              <Switch>
                <Route path="/" exact>
                  <NavBar />
                  <HeadLine />
                </Route>
                <ProtectedRoute path="/dashboard/">
                  <Dashboard />
                </ProtectedRoute>
                <Route path="*">
                  <NotFound />
                </Route>
              </Switch>
            </AlertProvider>
          </AuthProvider>
        </Grid>
      );
    }
    
    ReactDOM.render(
      <React.StrictMode>
        <Router>
          <Provider>
            <App />
          </Provider>
        </Router>
        <test />
      </React.StrictMode>,
      document.getElementById('root')
    );

    export default App;

    `

    const parser = new AstParser()
    const {importStatements, ast, components, exportStatements} = parser.parse(code)
    console.log(components, exportStatements)    
  })
})