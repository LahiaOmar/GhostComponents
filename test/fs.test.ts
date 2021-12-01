import { join, isFile, isFilePath, isDirectory } from "../src/helpers/fs";

describe("TESTING SOME FS HELPERS", () => {
  it("isFile should return true with a valid file path  ", async () => {
    const pathFile = join(process.cwd(), "/src/index.ts");

    const isAFile = await isFile(pathFile);

    expect(isAFile).toBe(true);
  });

  it("isFilePath should return true with a valid file path and his extension", async () => {
    const pathFile = join(process.cwd(), "/src/index");

    const isAFile = await isFilePath(pathFile, ".ts");

    expect(isAFile).toBe(true);
  });

  it("isDirectory should return true with valide path directory", async () => {
    const pathDir = process.cwd();

    const isDir = await isDirectory(pathDir);

    expect(isDir).toBe(true);
  });
});
