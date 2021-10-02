import {Command} from 'commander'
interface Option {
  option: string,
  description: string
}

/**
 * CLI
 */
class Cli{
  
  CLIOptions:Array<Option> = [
    {option: '-e, --entry-point <type>', description: 'Path of entry point'},
    {option: '-r, --root-folder <type>', description: 'Path of root folder'},
    {option: '-v, --version', description: 'version'},
    {option: '-u, --usage', description: 'How to use the CLI'}
  ]
  program: Command

  constructor(){
    this.program = new Command()
    this.CLIOptions.forEach(({option, description}) => {
      this.program.option(option, description)
    })
  }

  argvParsing = () => {
    this.program.parse(process.argv)
    return this.program.opts()
  }

  showVersion = () => {
    console.log("1.0.0")
  }

  showUsage = () => {
    console.log("Ghose Component CLI, ./GhostComponent ./ ./index.js")
  }
}

export default Cli