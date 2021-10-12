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
    const skip = await cli.toSkip()

    const api = new Api(rootFolder, entryPoint, skip)
    const ghost = await api.searchGhost()
    
  })()
}

