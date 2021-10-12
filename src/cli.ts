import {Command} from 'commander'
interface Option {
  option: string,
  description: string
}

/**
 * CLI
 */
class Cli{
  
  private CLIOptions:Array<Option> = [
    {option: '-v, --version', description: 'version'},
    {option: '-u, --usage', description: 'How to use the CLI'},
    {option: '-s, --skip', description: 'folders to skip'}
  ]
  private requiredOption:Array<Option> = [
    {option: '-e, --entry-point <type>', description: 'Path of entry point'},
    {option: '-r, --root-folder <type>', description: 'Path of root folder'},
  ]
  private program: Command

  constructor(){
    this.program = new Command()
  
    this.CLIOptions.forEach(({option, description}) => {
      this.program.option(option, description)
    })

    this.requiredOption.forEach(({option, description}) => this.program.requiredOption(option, description))
  }

  argvParsing = () => {
    this.program.parse(process.argv)
    return this.program.opts()
  }

  showVersion = () => {
    
  }

  showUsage = () => {
    console.log("Ghose Component CLI, ./GhostComponent ./ ./index.js")
  }

  exitOverride = () => {
    this.program.exitOverride()
  }
}

export default Cli