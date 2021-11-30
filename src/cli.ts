import { Command, OptionValues } from "commander";
import Enquirer from "enquirer";
import Api from "./api";
import { version, name } from "../package.json";
import chalk from "chalk";
import { asciiArt } from "./helpers/ascii-art";
interface Option {
  option: string;
  description: string;
}

/**
 * CLI
 */
class Cli {
  private CLIOptions: Array<Option> = [
    { option: "-u, --usage", description: "How to use the CLI" },
    { option: "-e, --entry-point <type>", description: "Path of entry point" },
    { option: "-r, --root-folder <type>", description: "Path of root folder" },
    {
      option: "-rc, --root-component <type>",
      description: "Name of Root components in your app entry point",
    },
  ];
  private program: Command;
  private enq: Enquirer;
  private ghosts: { name: string; path: string }[] = [];
  private totalComponents: number = 0;
  private options: OptionValues = {};

  /**
   * Constructor of CLI
   */
  constructor() {
    this.program = new Command();
    this.enq = new Enquirer();

    this.CLIOptions.forEach(({ option, description }) => {
      this.program.option(option, description);
    });
  }

  /**
   * init CLI
   */
  initCLI = async () => {
    const name = await asciiArt("GhostComponents");

    this.program.version(version, "-v, --version", "show the current version");
    this.program.showHelpAfterError("add --help for additional informations");
    this.program.showSuggestionAfterError();
    this.program.name("\n" + name);
  };

  /**
   * start searching for GHOSTS CLI
   * @param {string} rootFolder
   * @param {string} entryPoint
   */
  start = async (
    rootFolder: string,
    entryPoint: string,
    rootComponent: string
  ) => {
    const api = new Api({ rootFolder, entryPoint, rootComponent });
    const { ghosts, totalComponents } = await api.searchGhost();
    this.ghosts = ghosts;
    this.totalComponents = totalComponents;
  };

  /**
   * parsing cli arguments
   * @returns {Option[]} - array of arguments
   */
  argvParsing = () => {
    this.program.parse(process.argv);
    this.options = this.program.opts();

    if (!Object.keys(this.options).length) {
      this.program.help();
    }
    return this.options;
  };

  /**
   * Show how to use the CLI
   */
  showUsage = () => {
    console.log(
      this.program.name() +
        "\n\n" +
        "To search for non-used components, -e and -r are required.\n" +
        "If your entry point does not contain ReactDOM.render, use -rc to provide the root component name.\n\n" +
        chalk.green(
          "  foo@bar:~$ ghostcomponents -r ./PATH_PROJECT_ROOT -e ./PATH_ENTRYPOINT_APP -rc ROOT_COMPONENT_NAME\n"
        )
    );
  };

  /**
   * Show the result
   */
  showResult = () => {
    console.log(this.program.name());
    console.log(
      `You created -> ${this.totalComponents} components\n\n` +
        `You're using -> ${
          this.totalComponents - this.ghosts.length
        } components\n\n` +
        `The number of Ghosts are : ${this.ghosts.length}\n`
    );

    this.ghosts.forEach((ghost) => {
      console.log(
        chalk.red(`  <${ghost.name} />`) +
          " -> " +
          chalk.blueBright(`${ghost.path}`)
      );
    });
    console.log("\n");
  };

  exitOverride = () => {
    this.program.exitOverride();
  };
}

export default Cli;
