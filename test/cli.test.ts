import Cli from "../src/cli";

describe("TESTING CLI", () => {
  it("should pasrse root folder and entry point as arguments", () => {
    let cli = new Cli();
    process.argv = ["", "", "-r", "./root", "-e", "./App.js"];
    const { rootFolder, entryPoint } = cli.argvParsing();

    expect(rootFolder).toBe("./root");
    expect(entryPoint).toBe("./App.js");
  });
});
