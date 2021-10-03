import fs from 'fs/promises'
import path from 'path'

export const resolvePackageJson = (dirPath:string) => {

  return ""
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

export const isValidDirectory = async (p:string) => {
  const isDir = await isDirectory(p)
  if (!isDir) {
    return false
  }
  // we should skip this directory names. 
  const skippedDirs = ["node_modules", "test", "tests", "styles"]
  const dirName:string|undefined = p.split(path.sep).pop()
  const skip = skippedDirs.includes(dirName||'')
  return !skip
}

export const isReactComponent = async (file:string, p:string) => {
  const isFilePath = await isFile(p)
  if (!isFilePath) return false

  // have a .js extension
  const { ext, base } = path.parse(p)
  const isJsExtention = ext === '.js'
  if (!isJsExtention || base.includes('test')) return false

  const shouldContaine = [
    `import React from 'react'`
  ]
  // it should containe import react from 'react'
  return file.includes(shouldContaine[0])
}