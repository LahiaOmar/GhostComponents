import fs from 'fs/promises'
import path from 'path'
import {fileASTparser} from './parser'

export const resolveIndexFile = async (dirPath:string, componentName:string):Promise<string> => {
  // Read the file
  const indexPath = join(dirPath, 'index.js')
  const file = await readFile(indexPath)
  // Extracte the export
  const {exportStatements, importStatement} = fileASTparser(file, {})
  // find the export.

  let foundExport = false

  exportStatements.forEach(({specifiers, declaration}) => {
    if(specifiers){
      specifiers.forEach(sp => {
        if(sp.type === "ExportSpecifier" && sp.exported.type === "Identifier"){
          const {local, exported} = sp
          if(local.name !== componentName && exported.name === componentName){
            componentName = local.name
            foundExport = true;
          }
          if(local.name === componentName && exported.name === componentName){
            foundExport = true
          }
        }
      })
    }
    if(declaration && declaration.type === "Identifier"){
      if(declaration.name === componentName ){
        foundExport = true
      }
    }
  })

  if(!foundExport){
    throw new Error(`The component ${componentName} is not found in ${indexPath}`)
  }
  let componentPath = ''

  importStatement.forEach(({specifiers, source}) => {
    specifiers.forEach(({local, imported}) => {
      if(local === componentName || imported === componentName)
        componentPath = source
    })
  })

  // and map it to his import statement.
  return componentPath
}

export const resolvePackageJson = async (dirPath:string, componentName: string):Promise<string> => {
  const packagePath = join(dirPath, 'package.json')
  const file = await readFile(packagePath)

  const jsonFile = JSON.parse(file)
  const {name, main} = jsonFile
  
  if(name !== componentName){
    throw new Error(`name : ${name} in the package.json don't match with component name ${componentName}`)
  }

  return main
}

export const parse = (p:string) => {
  return path.parse(p)
}

export const join = (...p:string[]) => {
  return path.join(...p)
}

export const readFile = async (filePath:string) => {
  const file = await fs.readFile(filePath, 'utf8')
  return file
}

const getPathStat = (p:string) => fs.stat(p)

export const isFile = async (filePath:string) => {
  try {
    const stat = await getPathStat(filePath)
    return stat.isFile()
  }
  catch (ex) {
    return false
  }
}

export const isFilePath = async (filePath:string, ext:string) => {
  const is = await isFile(filePath + ext)
  return is
}

export const isDirectory = async (dirPath:string) => {
  try {
    const stat = await getPathStat(dirPath)
    return stat.isDirectory()
  }
  catch (ex) {
    return false
  }
}

export const readDirectory = async (dirPath:string) => {
  const dirContent = await fs.readdir(dirPath)
  return dirContent
}

export const isValidDirectory = async (p:string, toSkip:Array<string>): Promise<boolean> => {
  const isDir = await isDirectory(p)
  if (!isDir) {
    return false
  }

  const dir = p.split('/').pop()
  if(!dir) return false

  let isValid = true
  
  toSkip.forEach(m => {
    if(dir.match(m)){
      isValid = false
    }
  })
  
  return isValid 
}

export const isReactComponent = async (file:string, p:string) => {
  const { ext, base } = path.parse(p)
  const isJsExtention = ext === '.js'
  if (!isJsExtention || base.includes('test')) return false

  const impReactReg = /import\s*(React|\* as React)[\w{}\s,'"]*\s*from \s*('|")react('|")(;)?/g

  const isContaines = file.split('\n').map(line => {
    const match = line.match(impReactReg)
    return (match && match.length > 0)
  })
  return isContaines.includes(true)
}

export const isValideImport = (imp:string) => {
  return imp.startsWith('.')
}

export const saveToJSON = async (data:Object, fileName:string) => {
  if(!fileName || fileName === '')
    fileName = "Ghosts"
  await fs.writeFile(fileName + '.json', JSON.stringify(data))
}