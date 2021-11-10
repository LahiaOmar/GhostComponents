import fs from 'fs/promises'
import path from 'path'
import {AstParser} from './parser'

export const findFileExtension = async (path:string, extensions:Array<string>) => {
  const {dir, base} = parse(path)
  const dirContent = await readDirectory(dir)
  for(const contentName of dirContent){
    const foundExt = extensions.find(ext => base + ext === contentName)
    if(foundExt){
      return foundExt
    }
  }
  // TODO: throw Error : we couldn't find the extension of this file. {path}
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

  const {name} = parse(p)
  if(!name) return false

  let isValid = true
  
  toSkip.forEach(m => {
    if(name.match(m)){
      isValid = false
    }
  })
  
  return isValid 
}

export const isReactComponent = async (file:string, p:string, extensions:Array<string>) => {
  const { ext, name } = path.parse(p)
  const foundExt = extensions.includes(ext)

  if (!foundExt || name.includes('.test')) return false

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