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
  // TODO: throw Error : we couldn't find the extension of this file. {path}
};

export const parse = (p: string) => {
  return path.parse(p);
};

export const join = (...p: string[]) => {
  return path.join(...p);
};

export const readFile = async (filePath: string) => {
  const file = await fs.readFile(filePath, "utf8");
  return file;
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
  const dirContent = await fs.readdir(dirPath);
  return dirContent;
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
    if (name.match(m)) {
      isValid = false;
    }
  });

  return isValid;
};

export const isValideImport = (imp: string) => {
  return imp.startsWith(".");
};
