import { thisExpression } from '@babel/types'
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

import {fileASTparser, ParseResult} from './helpers/parser'
/***
 * API
 *  
 */
export class Api {
  private rootFolder: string
  private entryPoint: string
  private skip: Array<string>
  private allComponents: Map<string, ParseResult> = new Map()
  private usedComponents: Array<string> = []  
  private ghosts: Array<string> = []
  private extensions:Array<string> = ['.js', '.ts', '.tsx', '.node']
  /**
   * 
   * @param {string} rootFolder - Path to the root folder 
   * @param {string} entryPoint  - Path to the entry point
   */
  constructor(rootFolder:string, entryPoint:string, skip:Array<string>){
    this.rootFolder = rootFolder
    this.entryPoint = entryPoint
    
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

    await this.findUsedComponents(this.entryPoint)

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
          const fileAST = fileASTparser(file, {})
          this.allComponents.set(currentPath, fileAST)
        }
      }
      else if (isDirPath) {
        let files = await readDirectory(currentPath)
  
        for (const file of files) {
          const pt = join(currentPath, file)
          await this.findAllComponents(pt)
        }
      }
  }

  /**
   * Find the used components if the app.
   * @param {string} filePath - path of the component, the function start with the entry point of the app.
   */
  private async findUsedComponents(filePath:string){
    const currentCmp  = this.allComponents.get(filePath)
    if(!currentCmp) return

    if (!this.usedComponents.find(p => p === filePath)) {
      this.usedComponents.push(filePath)
    }
    
    const {importStatement, JSXtags} = currentCmp
    
    const components:Array<{component:string, path:string}> = []
    
    JSXtags.forEach(tag => {
      importStatement.forEach(imp => {
        const { specifiers, source } = imp
        specifiers.forEach(sp => {
          let tagIsFound = false
          if (sp.local !== undefined) tagIsFound = sp.local === tag
          if (sp.imported !== undefined && !tagIsFound) tagIsFound = sp.imported === tag
          if (tagIsFound) {
            const component = (sp.imported) ? sp.imported: sp.local
            components.push({ component, path: source })
          }
        })
      })
    })
    
    for (let { path, component } of components) {
      const { dir } = parse(filePath)
      path = join(dir, path)
      
      const isPathDir = await isDirectory(path)

      if (isPathDir) {
        const indexPath = await resolveIndexFile(path, component, this.extensions)
        const packagePath = await resolvePackageJson(path, component)

        path = path + ( indexPath.length ? indexPath : packagePath )
      }
      else {
        const endWithExt = this.extensions.map(ext => path.endsWith(ext)).some(el => el)
        
        if(!endWithExt){
          const fileExt = await findFileExtension(path, this.extensions)
          path = path + fileExt
        }
      }
      await this.findUsedComponents(path)
    }
  }

  /**
   * Find unused components based on all components found and the used components.
   */
  private findUnusedComponents(){
    this.allComponents.forEach((_, key) => {
      const found = this.usedComponents.find( p => p === key)
      if(!found){
        this.ghosts.push(key)
      }
    })    
  }
}
