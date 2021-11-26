import Cli from "./cli";

const cli = new Cli();

const { usage, rootFolder, entryPoint } = cli.argvParsing();

if (usage) {
  cli.showUsage();
  process.exit(0);
}

if (rootFolder && entryPoint) {
  (async () => {
    try {
      await cli.start(rootFolder, entryPoint);

      cli.showResult();
    } catch (ex: any) {
      console.log("there is some problems : ", ex.message);
    }
  })();
}
