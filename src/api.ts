class Api {
  private rootFolder: string
  private entryPoint: string
  private skip: Array<string>
  private allComponent?: Map<string,{}>
  private usedComponents?: Array<string>  

  /**
   * 
   * @param {string} rootFolder 
   * @param {string} entryPoint 
   */
  constructor(rootFolder:string, entryPoint:string, skip:Array<string>){
    this.rootFolder = rootFolder
    this.entryPoint = entryPoint
    
    this.skip = ["test", "node_modules"]
    this.skip = this.skip.concat(skip)
  }

  /**
   * start searching for unused component. 
   */
  async searchGhost(){

    await this.findAllComponents(this.rootFolder)

    await this.findUsedComponents(this.entryPoint)

    await this.findUnusedComponents()
  }

  /**
   * Find all components in the project. 
   * @param {string} currentPath - current path, the function start with the root folder of the app.
   */
  async findAllComponents(currentPath:string){

  }

  /**
   * Find the used components if the app.
   * @param {string} currentFile - path of the component, the function start with the entry point of the app.
   */
  async findUsedComponents(currentFile:string){

  }

  /**
   * Find unused components based on all components found and the used components.
   */
  async findUnusedComponents(){

  }
}