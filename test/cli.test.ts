import Cli from '../src/cli'

describe("TESTING CLI", () => {
  let cli = new Cli()

  it("should have root folder and entry point as arguments", () => {
    process.argv = ['','','-r', './root', '-e', './App.js']
    const {rootFolder, entryPoint} = cli.argvParsing()
    
    expect(rootFolder).toBe('./root')
    expect(entryPoint).toBe("./App.js")
  })
})