import Cli from './cli'

const cli = new Cli()
const {
  version,
  usage,
  skip,
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
  })()
}