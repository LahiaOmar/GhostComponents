import {
  isFile,
  isValidDirectory,
  isReactComponent,
  isDirectory,
  readFile,
  readDirectory,
  resolveIndexFile,
  resolvePackageJson,
  join,
  parse,
  findFileExtension
} from './helpers/fs'

import {
  AstParser, 
  ParseResult,
  Component,
} from './helpers/parser'




/***
 * API
 *  
 */
export class Api {
  private rootFolder: string
  private entryPoint: string
  private skip: Array<string>
  private allComponents: Map<string, ParseResult> = new Map()
  private usedComponents: {name: string, path:string}[] = []  
  private ghosts: {name:string, path:string}[] = []
  extensions:Array<string> = ['.js', '.ts', '.tsx', '.node']
  private astParser:AstParser

  /**
   * 
   * @param {string} rootFolder - Path to the root folder 
   * @param {string} entryPoint  - Path to the entry point
   */
  constructor(rootFolder:string, entryPoint:string, skip:Array<string>){
    this.rootFolder = rootFolder
    this.entryPoint = entryPoint
    this.astParser = new AstParser()

    this.skip = ["node_modules", "test", "tests", "styles"]
    this.skip = this.skip.concat(skip)
    this.resolvePath();
  }

  private resolvePath(){
    this.rootFolder = join(process.cwd(), this.rootFolder)
    this.entryPoint = join(process.cwd(), this.entryPoint)
  }
  
  /**
   * start searching for unused component. 
   */
  async searchGhost(){
    await this.findAllComponents(this.rootFolder)

    await this.findUsedComponents(this.entryPoint, 'ReactDOM.render')

    this.findUnusedComponents()
    
    return this.ghosts
  }

  /**
   * Find all components in the project. 
   * @param {string} currentPath - current path, the function start with the root folder of the app.
   */
  private async findAllComponents(currentPath:string){
      const isFilePath = await isFile(currentPath)
      const isDirPath = await isValidDirectory(currentPath, this.skip)

      if (isFilePath) {
        const file = await readFile(currentPath)
        const isComponent = await isReactComponent(file, currentPath, this.extensions)
        
        if (isComponent) {
          const fileAST = this.astParser.parse(file)
          this.allComponents.set(currentPath, fileAST)
        }
      }
      else if (isDirPath) {
        let files = await readDirectory(currentPath)
        
        for (const file of files) {
          const nextPath = join(currentPath, file)
          await this.findAllComponents(nextPath)
        }
      }
  }

  /**
   * Find the used components if the app.
   * @param {string} filePath - path of the component.
   */
  private async findUsedComponents(filePath:string, localComponentName:string | null){
    const currentCmp  = this.allComponents.get(filePath)
    if(!currentCmp) return
    const {importStatements, exportStatements, components} = currentCmp
    let fileComponents = [...components]

    exportStatements.forEach(exp => {
      if(exp.exported != exp.local && exp.exported === localComponentName){
        localComponentName = exp.local
      }
    })

    const nextComponents:{name:string, path:string}[] = []

    const filterNextComponents = (current:Component, components:Component[]) => {
      components = components.filter(({info})=>{info.name === current.info.name})

      for(const tag of current.tags){
        const foundNext = components.findIndex(({info}) => info.name === tag )
        const nextComponent = components.find(({info}) => info.name === tag)
        if(foundNext > 0 && nextComponent){
          components = components.filter((_, index) => index !== foundNext)
          filterNextComponents(nextComponent, components)
        } 
        else{
          const foundExternal = importStatements.find(({source,specifiers}) => {
            const found = specifiers.find(sp => sp.local === tag)
            return found && source.startsWith('.')
          })
          if(foundExternal){
            nextComponents.push({name:tag, path : foundExternal.source})            
          }
        }
      }
    }
    let rootComponent = fileComponents.find(({info}) => info.name === localComponentName)
    
    if(rootComponent){
      this.usedComponents.push({name: rootComponent.info.name, path: filePath})
      filterNextComponents(rootComponent, fileComponents)
    }
    for (let { path, name } of nextComponents) {
      const { dir } = parse(filePath)
      let nextPath = join(dir, path)
      
      const isPathDir = await isDirectory(nextPath)

      if (isPathDir) {
        const indexPath = await resolveIndexFile(nextPath, name, this.extensions)
        const packagePath = await resolvePackageJson(nextPath, name)
        let restOfPath = ''

        if(indexPath){
          restOfPath = indexPath
        }
        else if (packagePath){
          restOfPath = packagePath
        }

        if(!indexPath && !packagePath){
          throw new Error("there no index.js or package.json to resolve the component")
        }
        
        nextPath = join(nextPath , restOfPath)
      }
      else {
        const endWithExt = this.extensions.map(ext => nextPath.endsWith(ext)).some(el => el)
        
        if(!endWithExt){
          const fileExt = await findFileExtension(nextPath, this.extensions)
          nextPath = nextPath + fileExt
        }
      }
      await this.findUsedComponents(nextPath, name)
    }
  }

  /**
   * Find unused components based on all components found and the used components.
   */
  private findUnusedComponents(){
    this.allComponents.forEach(({components}, key) => {
      components.forEach(({info, tags}) => {
        const componentName = info.name
        const found = this.usedComponents.find(({name, path}) => key === path && name === componentName )
        if(!found){
          this.ghosts.push({
            name: componentName,
            path: key
          })
        }
      })
    })
  }
}
