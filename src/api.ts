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
  ImportNode,
  ExportNode,
  Component,
  ComponentInfo
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
  private usedComponents: Array<Component> = []  
  private ghosts: Array<string> = []
  private extensions:Array<string> = ['.js', '.ts', '.tsx', '.node']
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
    // resolving the root component from the entry point
    console.log("start findAllComponents ")
    await this.findAllComponents(this.rootFolder)

    console.log("start find used components")
    await this.findUsedComponents(this.entryPoint, null)

    // this.findUnusedComponents()
    
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
          // every file -> instance of AstParser. 
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
  private async findUsedComponents(filePath:string, last:string | null){
    const currentCmp  = this.allComponents.get(filePath)
    if(!currentCmp) return
    const {importStatements, exportStatements, components} = currentCmp

    let fileComponents = [...components]
    // find if there is a different local name rather than the export one.
    let localComponentName:string = last ? last : ''
    
    exportStatements.forEach(exp => {
      if(exp.exported != exp.local && exp.exported === localComponentName){
        localComponentName = exp.local
      }
    })

    console.log({localComponentName, ...components})
    // find fileRootComponent.
    /**
     * filter file components:  
     *  - nextExternalComponents : we can find them in import paths (./).
     *  - usedLocalComponents : we can find them recursivly from the local root componnent
     * 
     * - first find the local used component
     * - second find the next external component based on the local used component.
     */
    const nextComponents:{name:string, path:string}[] = []

    const filterNextComponents = async (current:Component, components:Component[]) => {
      console.log(current, ...components)
      //add current to used component
      for(const tag of current.tags){
        const foundNext = components.findIndex(({info}) => info.name === tag )
        const nextComponent = components.find(({info}) => info.name === tag)
        if(foundNext > 0 && nextComponent){
          components = components.filter((_, index) => index !== foundNext)
          this.usedComponents.push(current)
          await filterNextComponents(nextComponent, components)
        } 
        else{
          // if it's a external
          const foundExternal = importStatements.find(({source,specifiers}) => {
            const found = specifiers.find(sp => sp.local === tag)
            return found && source.startsWith('.')
          })
          if(foundExternal){
            // console.log("found external ", foundExternal)
            nextComponents.push({name:tag, path : foundExternal.source})            
            this.usedComponents.push(current)
          }
        }
      }
      return
    }
    let rootComponent = fileComponents.find(({info}) => info.name === localComponentName )
    
    if(!rootComponent){
      rootComponent = fileComponents[0]
      fileComponents = fileComponents.slice(1, fileComponents.length)
    }
    
    await filterNextComponents(rootComponent, fileComponents)
    for (let { path, name } of nextComponents) {
      const { dir } = parse(filePath)
      path = join(dir, path)
      
      const isPathDir = await isDirectory(path)

      if (isPathDir) {
        const indexPath = await resolveIndexFile(path, name, this.extensions)
        const packagePath = await resolvePackageJson(path, name)

        path = path + ( indexPath.length ? indexPath : packagePath )
      }
      else {
        const endWithExt = this.extensions.map(ext => path.endsWith(ext)).some(el => el)
        
        if(!endWithExt){
          const fileExt = await findFileExtension(path, this.extensions)
          path = path + fileExt
        }
      }
      await this.findUsedComponents(path, name)
    }
  }

  /**
   * Find unused components based on all components found and the used components.
   */
  private findUnusedComponents(){
    this.allComponents.forEach((_, key) => {
      // const found = this.usedComponents.find( p => p === key)
      // if(!found){
      //   this.ghosts.push(key)
      // }
    })    
  }
}
