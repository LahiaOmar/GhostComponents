import {Command} from 'commander'
import Enquirer from 'enquirer'
import {
  saveToJSON
} from './helpers/fs'
interface Option {
  option: string,
  description: string
}

export enum SaveOptions {
  JSON = 'JSON'
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

  askForSkipFiles = async ():Promise<Array<string>> => {
    let toSkipPatterns:Array<string> = []

    const skipQuestion = {
      type : 'input',
      name: 'skip',
      message: 'Skip folder/file, enter a list of names or patterns separated by a space'
    }

    const skiped:any = await this.enq.prompt(skipQuestion)

    if(skiped.skip != ''){
      toSkipPatterns = skiped.skip.split(' ').map((s:any) => {
        return s.replace(/"/g, ' ');
      })
    }
    
    return toSkipPatterns
  }

  askToSaveResult = async (data:Object) => {
    const response:any = await this.enq.prompt({
      type: 'select',
      name: 'save',
      message: 'to save the result, choose a file format, or chose not save',
      choices: ['JSON','Not save']
    });

    if(response.save === 'JSON'){
      const question = {
        type : 'input',
        name: 'fileName',
        message: 'chose a file name, (default one is Ghosts.json)'
      }
  
      const fileName:any = await this.enq.prompt(question)

      this.saveResult(SaveOptions.JSON, data ,fileName.fileName);
    }
  }

  saveResult = async (type:SaveOptions, data:Object, fileName:string) => {
    switch(type){
      case SaveOptions.JSON:
        await saveToJSON(data, fileName)
        break
      
      default:
        throw new Error('Wrong type')
    }
  }

}

export default Cli