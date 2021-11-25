import {
  isFile,
  isValidDirectory,
  isDirectory,
  readFile,
  readDirectory,
  join,
  parse,
  findFileExtension,
} from "./helpers/fs";
import { AstParser, ParseResult, Component } from "./parser";

/***
 * API
 *
 */
export default class Api {
  private rootFolder: string;
  private entryPoint: string;
  private skip: Array<string>;
  private allComponents: Map<string, ParseResult> = new Map();
  private usedComponents: { name: string; path: string }[] = [];
  private ghosts: { name: string; path: string }[] = [];
  extensions: Array<string> = [".js", ".ts", ".tsx", ".node", ".jsx"];
  private astParser: AstParser;

  /**
   *
   * @param {string} rootFolder - Path to the root folder
   * @param {string} entryPoint  - Path to the entry point
   */
  constructor(rootFolder: string, entryPoint: string) {
    this.rootFolder = rootFolder;
    this.entryPoint = entryPoint;
    this.astParser = new AstParser();

    this.skip = ["node_modules", "test", "tests", "styles", ".git", ".vscode"];
    this.resolvePath();
  }

  private resolvePath() {
    this.rootFolder = join(process.cwd(), this.rootFolder);
    this.entryPoint = join(process.cwd(), this.entryPoint);
  }

  /**
   * start searching for unused component.
   */
  async searchGhost() {
    await this.findAllComponents(this.rootFolder);

    await this.findUsedComponents(this.entryPoint, "ReactDOM.render");

    this.findUnusedComponents();

    let totalComponents = 0;
    this.allComponents.forEach((cmp) => {
      totalComponents += cmp.components.length;
    });
    return {
      ghosts: this.ghosts,
      totalComponents: totalComponents,
    };
  }

  /**
   * Find all components in the project.
   * @param {string} currentPath - current path, the function start with the root folder of the app.
   */
  private async findAllComponents(currentPath: string) {
    const isFilePath = await isFile(currentPath);
    const isDirPath = await isValidDirectory(currentPath, this.skip);

    if (isFilePath && this.validFileExt(currentPath)) {
      const file = await readFile(currentPath);

      const fileAST = this.astParser.parse(file);
      if (fileAST.components.length > 0)
        this.allComponents.set(currentPath, fileAST);
    } else if (isDirPath) {
      let files = await readDirectory(currentPath);

      for (const file of files) {
        const nextPath = join(currentPath, file);
        await this.findAllComponents(nextPath);
      }
    }
  }

  /**
   * Find the used components if the app.
   * @param {string} filePath - path of the component.
   * @param {string} localComponentName
   */
  private async findUsedComponents(
    filePath: string,
    localComponentName: string | null
  ) {
    // prevent infinite loop. (A use B, and B use A)
    const isVisitedFile = this.usedComponents.find(
      (file) => file.path === filePath
    );
    if (isVisitedFile) return;

    const currentCmp = this.allComponents.get(filePath);
    if (!currentCmp) return;

    const { importStatements, exportStatements, components } = currentCmp;
    let fileComponents = [...components];

    exportStatements.forEach((exp) => {
      if (exp.exported != exp.local && exp.exported === localComponentName) {
        localComponentName = exp.local;
      }
    });

    const nextComponents: { name: string; path: string }[] = [];

    //find local used components, and find the next external components.
    const filterNextComponents = (
      current: Component,
      components: Component[]
    ) => {
      components = components.filter(({ info }) => {
        return info.name !== current.info.name;
      });

      for (const tag of current.tags) {
        const foundNext = components.findIndex(({ info }) => info.name === tag);
        const nextComponent = components.find(({ info }) => info.name === tag);
        if (foundNext >= 0 && nextComponent) {
          this.usedComponents.push({
            name: nextComponent.info.name,
            path: filePath,
          });
          components = components.filter((_, index) => index !== foundNext);
          filterNextComponents(nextComponent, components);
        } else {
          const foundExternal = importStatements.find(
            ({ source, specifiers }) => {
              const found = specifiers.find((sp) => sp.local === tag);
              return found && source.startsWith(".");
            }
          );
          if (foundExternal) {
            nextComponents.push({ name: tag, path: foundExternal.source });
          }
        }
      }
    };
    let rootComponent = fileComponents.find(
      ({ info }) => info.name === localComponentName
    );

    if (rootComponent) {
      this.usedComponents.push({
        name: rootComponent.info.name,
        path: filePath,
      });

      filterNextComponents(rootComponent, fileComponents);
    }
    for (let { path, name } of nextComponents) {
      const { dir } = parse(filePath);
      let nextPath = join(dir, path);

      const isPathDir = await isDirectory(nextPath);

      if (isPathDir) {
        const indexPath = await this.resolveIndexFile(nextPath, name);
        const packagePath = await this.resolvePackageJson(nextPath, name);
        let restOfPath = "";

        if (indexPath) {
          restOfPath = indexPath;
        } else if (packagePath) {
          restOfPath = packagePath;
        }

        nextPath = join(nextPath, restOfPath);
      } else {
        const endWithExt = this.extensions
          .map((ext) => nextPath.endsWith(ext))
          .some((el) => el);

        if (!endWithExt) {
          const fileExt = await findFileExtension(nextPath, this.extensions);
          nextPath = nextPath + fileExt;
        }
      }
      await this.findUsedComponents(nextPath, name);
    }
  }

  /**
   * Find unused components based on all components found and the used components.
   */
  private findUnusedComponents() {
    this.allComponents.forEach(({ components }, key) => {
      components.forEach(({ info, tags }) => {
        const componentName = info.name;
        const found = this.usedComponents.find(
          ({ name, path }) => key === path && name === componentName
        );
        if (!found) {
          this.ghosts.push({
            name: componentName,
            path: key,
          });
        }
      });
    });
  }

  /**
   *
   * @param {string} dirPath - directory path
   * @param {string} componentName - component name
   * @param {string[]} extensions -
   * @returns
   */
  private resolveIndexFile = async (
    dirPath: string,
    componentName: string
  ): Promise<string | null> => {
    const fileExt = await findFileExtension(
      join(dirPath, "index"),
      this.extensions
    );
    const indexPath = join(dirPath, "index" + fileExt);
    const file = await readFile(indexPath);
    const astParser = new AstParser();

    const { exportStatements, importStatements } = astParser.parse(file);

    let foundExport = false;

    exportStatements.forEach(({ local, exported }) => {
      if (local !== componentName && exported === componentName) {
        componentName = local;
        foundExport = true;
      }
      if (local === componentName && exported === componentName) {
        foundExport = true;
      }
    });

    if (!foundExport) {
      throw new Error(
        `We can't find the component ${componentName} exported from ${dirPath}`
      );
    }
    let componentPath = "";

    importStatements.forEach(({ specifiers, source }) => {
      specifiers.forEach(({ local, imported }) => {
        if (local === componentName || imported === componentName)
          componentPath = source;
      });
    });

    if (componentPath === "") {
      throw new Error(
        `we can't find the exported component ${componentName} in you imports, ${dirPath}`
      );
    }
    // and map it to his import statement.
    return componentPath + fileExt;
  };
  /**
   *
   * @param {string} dirPath - directory path
   * @param {sstring} componentName - component name
   * @returns
   */
  private resolvePackageJson = async (
    dirPath: string,
    componentName: string
  ): Promise<string | null> => {
    const packagePath = join(dirPath, "package.json");
    const foundPackadge = await isFile(packagePath);
    if (!foundPackadge) return null;
    const file = await readFile(packagePath);

    const jsonFile = JSON.parse(file);
    const { name, main } = jsonFile;

    if (name !== componentName) {
      throw new Error(
        `name : ${name} in the package.json don't match with component name ${componentName}`
      );
    }

    return main;
  };

  /**
   * return if a file have a valide extension.
   * @param {string} path - file path
   * @returns {boolean}
   */
  validFileExt = (path: string): boolean => {
    const { ext } = parse(path);

    return this.extensions.some((extension) => extension === ext);
  };
}
