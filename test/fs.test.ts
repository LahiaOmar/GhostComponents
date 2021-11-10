import { isValidDirectory } from "../src/helpers/fs";

describe("TESTING SOME FS HELPERS", () => {
  it("should verify if a path is a valid directory path", async () => {
    const path = process.cwd();
    const toSkip = ["test", "node_modules"];
    const isValid = await isValidDirectory(path, toSkip);

    expect(isValid).toBe(true);
  });
});
