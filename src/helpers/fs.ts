import fs from "fs/promises";
import path from "path";

/**
 * find the extension of a file.
 * @param {string} path - file path
 * @param extensions - arrays of valid extensions
 * @returns {string} - the file extension.
 */
export const findFileExtension = async (
  path: string,
  extensions: Array<string>
) => {
  const { dir, base } = parse(path);
  const dirContent = await readDirectory(dir);
  for (const contentName of dirContent) {
    const foundExt = extensions.find((ext) => base + ext === contentName);
    if (foundExt) {
      return foundExt;
    }
  }

  throw new Error(
    `This file doesn't have a valid extension: ${path}` +
      `\nWe support this list of extensions: ${extensions.toString()}` +
      `\nif you use a valid extension for React project we don't support, please open an issue there: https://github.com/LahiaOmar/GhostComponents/issues`
  );
};

/**
 * parse a path string ( base on path.pasre )
 * @param {string} p - path
 * @returns {object}
 */
export const parse = (p: string) => {
  return path.parse(p);
};

/**
 * join all arguments paths
 * @param {string} p - object of all arguments passed.
 * @returns
 */
export const join = (...p: string[]) => {
  return path.join(...p);
};

/**
 * read a file
 * @param {string} - filePath - file path
 * @returns {string} - file content
 */
export const readFile = async (filePath: string) => {
  try {
    const file = await fs.readFile(filePath, "utf8");
    return file;
  } catch (ex: any) {
    throw new Error(
      `ERROR_MESSAGE: ${ex.message}` +
        `While reading this file: ${filePath}` +
        `\nCheck the content of this file`
    );
  }
};

/**
 *  get stat of a path
 * @param {string} p - path
 * @returns
 */
const getPathStat = (p: string) => fs.stat(p);

/**
 * test if a path is a file path
 * @param {string} filePath - path
 * @returns {boolean} - true if is a file path, false otherwise.
 */
export const isFile = async (filePath: string) => {
  try {
    const stat = await getPathStat(filePath);
    return stat.isFile();
  } catch (ex) {
    return false;
  }
};

/**
 * test if a current path concat with a extension
 * @param {string} filePath
 * @param {string} ext
 * @returns {boolean}
 */
export const isFilePath = async (filePath: string, ext: string) => {
  const is = await isFile(filePath + ext);
  return is;
};

/**
 * Test if a path is a directory path.
 * @param {string} dirPath
 * @returns {boolean}
 */
export const isDirectory = async (dirPath: string) => {
  try {
    const stat = await getPathStat(dirPath);
    return stat.isDirectory();
  } catch (ex) {
    return false;
  }
};

/**
 * read the content of a directory
 * @param {string} dirPath
 * @returns {boolean}
 */
export const readDirectory = async (dirPath: string) => {
  try {
    const dirContent = await fs.readdir(dirPath);
    return dirContent;
  } catch (ex: any) {
    throw new Error(
      `ERROR_MESSAGE: ${ex.message}` +
        `Error while reading the content of this directory: ${dirPath}`
    );
  }
};

/**
 * test we should skip a directory
 * @param {string} p
 * @param {Array.<string>} toSkip - array of folders name to skip
 * @returns {boolean}
 */
export const isValidDirectory = async (
  p: string,
  toSkip: Array<string>
): Promise<boolean> => {
  const isDir = await isDirectory(p);
  const { name } = parse(p);

  if (!isDir || !name) {
    return false;
  }

  const foundAMatch = toSkip.find((m) => name === m);
  return !foundAMatch;
};

/**
 * test if a import statement is valid. ( start with "." for external components)
 * @param {string} imp - import path
 * @returns {boolean}
 */
export const isValideImport = (imp: string) => {
  return imp.startsWith(".");
};
