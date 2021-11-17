import { Command } from "commander";
import Enquirer from "enquirer";
import Api from "./api";
import { version } from "../package.json";

interface Option {
  option: string;
  description: string;
}

export enum SaveOptions {
  JSON = "JSON",
}

/**
 * CLI
 */
class Cli {
  private CLIOptions: Array<Option> = [
    { option: "-u, --usage", description: "How to use the CLI" },
    { option: "-e, --entry-point <type>", description: "Path of entry point" },
    { option: "-r, --root-folder <type>", description: "Path of root folder" },
  ];
  private program: Command;
  private enq: Enquirer;
  private ghosts: { name: string; path: string }[] = [];
  private totalComponents: number = 0;

  constructor() {
    this.program = new Command();
    this.enq = new Enquirer();

    this.CLIOptions.forEach(({ option, description }) => {
      this.program.option(option, description);
    });

    this.program.name("ghostComponents").usage("<options>");

    this.program.version(version, "-v, --version", "show the current version");
    this.program.showHelpAfterError("add --help for additional informations");
    this.program.showSuggestionAfterError();
  }

  start = async (rootFolder: string, entryPoint: string) => {
    console.log("\n👻 Ghost chasing begins ");
    const api = new Api(rootFolder, entryPoint);
    const { ghosts, totalComponents } = await api.searchGhost();
    this.ghosts = ghosts;
    this.totalComponents = totalComponents;
  };

  argvParsing = () => {
    this.program.parse(process.argv);
    return this.program.opts();
  };

  showUsage = () => {
    console.log(
      "Ghose Component CLI, \n\n" +
        "To search for non-used components, -e and -r are required : \n " +
        "$ npx ghostComponents -r ./path-project-root -e ./entrypoint-app"
    );
  };

  showResult = () => {
    console.log(
      `You created : ${this.totalComponents} components\n\n` +
        `You're using ${
          this.totalComponents - this.ghosts.length
        } components\n\n` +
        `The number of Ghosts are : ${this.ghosts.length}\n`
    );

    this.ghosts.forEach((ghost) => {
      console.log(`\t<${ghost.name} /> -> ${ghost.path}`);
    });
    console.log("\n");
  };

  exitOverride = () => {
    this.program.exitOverride();
  };

  askForSkipFiles = async (): Promise<Array<string>> => {
    let toSkipPatterns: Array<string> = [];

    const skipQuestion = {
      type: "input",
      name: "skip",
      message:
        "Skip folder/file, enter a list of names or patterns separated by a space",
    };

    const skiped: any = await this.enq.prompt(skipQuestion);

    if (skiped.skip != "") {
      toSkipPatterns = skiped.skip.split(" ").map((s: any) => {
        return s.replace(/"/g, " ");
      });
    }

    return toSkipPatterns;
  };

  askToSaveResult = async () => {
    const response: any = await this.enq.prompt({
      type: "select",
      name: "save",
      message: "You can save the result in a JSON file !?",
      choices: ["Save", "Not Save"],
    });

    if (response.save === "Save") {
      const question = {
        type: "input",
        name: "fileName",
        message: "chose a file name, (default one is Ghosts.json)",
      };

      const fileName: any = await this.enq.prompt(question);

      this.saveResult(SaveOptions.JSON, fileName.fileName);
    }
  };

  private saveResult = async (type: SaveOptions, fileName: string) => {};
}

export default Cli;
