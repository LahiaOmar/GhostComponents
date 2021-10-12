import Cli from '../cli'

describe("TESTING CLI", () => {
  
  it("should have root folder and entry point as arguments", () => {
    let cli = new Cli()
    process.argv = ['','','-r', './root', '-e', './App.js']
    const {rootFolder, entryPoint} = cli.argvParsing()
    
    expect(rootFolder).toBe('./root')
    expect(entryPoint).toBe("./App.js")
  })

  it("should return a ERROR when we not provide root foler and/or entry point", () => {
      expect(() =>{
        let cli = new Cli()
        process.argv = ['','','-e', './App.js']
        cli.exitOverride()
        cli.argvParsing()
      }).toThrow()
  })
})