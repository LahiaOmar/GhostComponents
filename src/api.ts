import {
  isFile,
  isDirectory,
  readFile,
  readDirectory,
  join,
  parse,
  findFileExtension,
  matchRegex,
  readJSONFile,
  relative,
} from "./helpers/fs";
import { AstParser, ParseResult, Component } from "./parser";

interface ApiConstructor {
  rootFolder: string;
  entryPoint: string;
  rootComponent?: string;
}

interface Skip {
  pattern: RegExp;
}

interface ModuleAliases {
  baseUrl?: string;
  paths?: {
    [key: string]: string[];
  };
}

/***
 * API
 *
 */
export default class Api {
  private rootFolder: string;
  private entryPoint: string;
  private skip: Skip[] = [
    { pattern: /node_modules/ },
    { pattern: /test/ },
    { pattern: /tests/ },
    { pattern: /^\.[\w-]*/gm },
  ];
  private allComponents: Map<string, ParseResult> = new Map();
  private usedComponents: { name: string; path: string }[] = [];
  private ghosts: { name: string; path: string }[] = [];
  extensions: Array<string> = [".js", ".ts", ".tsx", ".node", ".jsx"];
  private astParser: AstParser;
  private rootComponent: string = "ReactDOM.render";
  private moduleConfigAliases: ModuleAliases = {};
  /**
   * API constructor
   * @param {string} rootFolder - Path to the root folder
   * @param {string} entryPoint  - Path to the entry point
   */
  constructor({ rootFolder, entryPoint, rootComponent }: ApiConstructor) {
    this.rootFolder = rootFolder;
    this.entryPoint = entryPoint;
    this.astParser = new AstParser();

    if (rootComponent) this.rootComponent = rootComponent;
  }

  initAPI = async () => {
    this.resolvePath();
    await this.loadModuleAliases();
  };

  /**
   * Load jsconfig.json or tsconfig.json to resolve module aliases patterns.
   */
  private loadModuleAliases = async () => {
    const JS_CONFIG_PATH = join(this.rootFolder, "jsconfig.json");
    const TS_CONFIG_PATH = join(this.rootFolder, "tsconfig.json");

    // loading jsconfig and tsconfig.
    const jsConfig = await readJSONFile(JS_CONFIG_PATH);
    const tsConfig = await readJSONFile(TS_CONFIG_PATH);

    jsConfig && this.parseConfigModuleAliases(jsConfig);
    tsConfig && this.parseConfigModuleAliases(tsConfig);
  };

  /**
   * resolve path and baseUrl for a jsconfig or tsconfig files.
   * @param content - file content
   */
  private parseConfigModuleAliases = (content: string) => {
    const {
      compilerOptions: { baseUrl, paths },
    } = JSON.parse(content);

    if (baseUrl) {
      this.moduleConfigAliases.baseUrl = baseUrl;
    }
    if (paths) {
      this.moduleConfigAliases.paths = paths;
    }
  };

  /**
   * Join the root folder and entry point path with the path of current process.
   */
  private resolvePath() {
    this.rootFolder = join(process.cwd(), this.rootFolder);
    this.entryPoint = join(process.cwd(), this.entryPoint);
  }

  /**
   * start searching for unused component.
   */
  async searchGhost() {
    await this.findAllComponents(this.rootFolder);

    await this.findUsedComponents(this.entryPoint, this.rootComponent);

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
    const isFilePath = await this.isValidFile(currentPath);
    const isDirPath = await this.isValidDirectory(currentPath);

    if (isFilePath) {
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
   * Find the used components.
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
    const filterNextComponents = async (
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
          let importSource: string | null = null;

          for (const { source, specifiers } of importStatements) {
            // console.log({ source });
            const foundLoaclName = specifiers.find(
              ({ local }) => local === tag
            );
            if (foundLoaclName) {
              const resolveSource = await this.resolveSourceImport(
                filePath,
                source
              );
              if (resolveSource) {
                importSource = resolveSource;
              }
            }
          }

          if (importSource) {
            nextComponents.push({ name: tag, path: importSource });
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

      await filterNextComponents(rootComponent, fileComponents);
    }

    for (let { path, name } of nextComponents) {
      const { dir } = parse(filePath);
      let nextPath = join(dir, path);

      const isPathDir = await isDirectory(nextPath);

      if (isPathDir) {
        // resolving the component path from index.js or package.json
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
      components.forEach(({ info }) => {
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
   * Resolve the component path from MODULE/index.(js, ...)
   * @param {string} dirPath - directory path
   * @param {string} componentName - component name
   * @param {string[]} extensions -
   * @returns {string | null}
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

    const foundExport = exportStatements.find(({ local, exported }) =>
      [local, exported].includes(componentName)
    );

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
        `we can't find the exported component ${componentName} in your imports, ${dirPath}`
      );
    }
    // and map it to his import statement.
    return componentPath + fileExt;
  };
  /**
   * Resolve the component path from MODULE/package.json
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
        `The name : ${name} in the package.json don't match with the component name: ${componentName}`
      );
    }

    return main;
  };

  /**
   * return if a file have a valide extension.
   * @param {string} path - file path
   * @returns {boolean}
   */
  private validFileExt = (path: string): boolean => {
    const { ext } = parse(path);

    return this.extensions.some((extension) => extension === ext);
  };

  /**
   * Test if a valide file to read.
   * @param filePath
   */
  private isValidFile = async (filePath: string) => {
    const file = await isFile(filePath);
    const { name, ext } = parse(filePath);
    const matchExt = this.validFileExt(filePath);
    const matchName = name.endsWith(".test");

    return !matchName && matchExt && file;
  };

  /**
   * test we should skip a directory
   * @param {string} p
   * @param {Array.<string>} toSkip - array of folders name to skip
   * @returns {boolean}
   */
  private isValidDirectory = async (p: string): Promise<boolean> => {
    const isDir = await isDirectory(p);
    const { name } = parse(p);

    const foundAMatch = this.skip.find(({ pattern }) => {
      return matchRegex(name, pattern);
    });

    return !foundAMatch && isDir;
  };

  /**
   * Resolve the source of the import.
   *  - if the import is based on Module Aliases, it's transform to relative path.
   * @param source
   * @returns {string | null} - string if the source is for an external component, null : otherwise
   */
  resolveSourceImport = async (
    filePath: string,
    source: string
  ): Promise<string | null> => {
    const isValid: boolean[] = [];
    const { baseUrl, paths } = this.moduleConfigAliases;
    // null case. if !./ and no moduleAliases.
    const normalSource = source.startsWith(".");
    if (normalSource) return source;

    if (!baseUrl) return null;
    let originalSource = "";
    if (baseUrl) {
      if (!paths) {
        // the source is base on just baseUrl
        originalSource = relative(filePath, join(this.rootFolder, source));
      } else {
        // the source is base on baseUrl + paths[i]
        for (const path in paths) {
          const _path = path.replace(/\*/, "");

          if (source.startsWith(_path)) {
            for (let p of paths[path]) {
              p = p.replace(/\*/, "");
              let _source = source.replace(_path, p);

              const { dir } = parse(filePath);
              originalSource = relative(dir, join(this.rootFolder, _source));
              if (!originalSource.startsWith(".")) {
                originalSource = "./" + originalSource;
              }
            }
          }
        }
      }
    }
    return originalSource;
  };
}
