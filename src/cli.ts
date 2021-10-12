import {Command} from 'commander'
import Enquirer from 'enquirer'

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
  ]
  private requiredOption:Array<Option> = [
    {option: '-e, --entry-point <type>', description: 'Path of entry point'},
    {option: '-r, --root-folder <type>', description: 'Path of root folder'},
  ]
  private program: Command
  private enq:Enquirer

  constructor(){
    this.program = new Command()
    this.enq = new Enquirer()

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

  toSkip = async ():Promise<Array<string>> => {
    let toSkipPatterns:Array<string> = []

    const skipQuestion = {
      type : 'input',
      name: 'skip',
      message: 'Skip folder/file, enter a list of names or patterns separated by a space'
    }

    const skiped:any = await this.enq.prompt(skipQuestion)

    if(skiped.skip != ''){
      const {skip} = skiped
      toSkipPatterns = skip.split(' ').map((s:any) => {
        return s.replace(/"/g, ' ');
      })
    }
    
    return toSkipPatterns
  }

}

export default Cli