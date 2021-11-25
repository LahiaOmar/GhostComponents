import fs from "fs/promises";
import path from "path";

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
    `This file doesn't have a valide extension: ${path}` +
      `We support this list of extensions: ${extensions.toString()}` +
      `\nif you use a valid extension for React project we don't support, please open an issus there: https://github.com/LahiaOmar/GhostComponents/issues`
  );
};

export const parse = (p: string) => {
  return path.parse(p);
};

export const join = (...p: string[]) => {
  return path.join(...p);
};

export const readFile = async (filePath: string) => {
  try {
    const file = await fs.readFile(filePath, "utf8");
    return file;
  } catch (ex: any) {
    throw new Error(
      `ERROR_MESSAGE: ${ex.message}` +
        `while reading this file: ${filePath}\ncheck the content of this file`
    );
  }
};

const getPathStat = (p: string) => fs.stat(p);

export const isFile = async (filePath: string) => {
  try {
    const stat = await getPathStat(filePath);
    return stat.isFile();
  } catch (ex) {
    return false;
  }
};

export const isFilePath = async (filePath: string, ext: string) => {
  const is = await isFile(filePath + ext);
  return is;
};

export const isDirectory = async (dirPath: string) => {
  try {
    const stat = await getPathStat(dirPath);
    return stat.isDirectory();
  } catch (ex) {
    return false;
  }
};

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

export const isValidDirectory = async (
  p: string,
  toSkip: Array<string>
): Promise<boolean> => {
  const isDir = await isDirectory(p);
  if (!isDir) {
    return false;
  }
  const { name } = parse(p);
  if (!name) return false;
  let isValid = true;

  toSkip.forEach((m) => {
    if (name == m) {
      isValid = false;
    }
  });

  return isValid;
};

export const isValideImport = (imp: string) => {
  return imp.startsWith(".");
};
