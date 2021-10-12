import Cli from './cli'
import { Api } from './api'

const cli = new Cli()

const {
  version,
  usage,
  rootFolder,
  entryPoint, } = cli.argvParsing()

if(version){
  cli.showVersion()
  process.exit(0)
}

if(usage){
  cli.showUsage()
  process.exit(0)
}
if(rootFolder && entryPoint){
  (async () => {
    try{
      const skip = await cli.askForSkipFiles()
      
      const api = new Api(rootFolder, entryPoint, skip)
      const ghost = await api.searchGhost()
      console.log("Ghost founded", ghost)
  
      cli.askToSaveResult(ghost)
    }
    catch(ex:any){
      console.log("there is some problems : ", ex.message)
    }
  })()
}

