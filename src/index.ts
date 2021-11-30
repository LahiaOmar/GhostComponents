#!/usr/bin/env node

import Cli from "./cli";

(async () => {
  const cli = new Cli();
  await cli.initCLI();

  const { usage, rootFolder, entryPoint, rootComponent } = cli.argvParsing();

  if (usage) {
    cli.showUsage();
    process.exit(0);
  }

  if (rootFolder && entryPoint) {
    try {
      await cli.start(rootFolder, entryPoint, rootComponent);

      cli.showResult();
    } catch (ex: any) {
      console.log("there is some problems : ", ex.message);
    }
  }
})();
