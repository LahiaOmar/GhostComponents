import { parse } from "@babel/parser";
import { File, Node } from "@babel/types";

import { isValideImport } from "./helpers/fs";

type specifierNode = { local: string; imported: string };
export interface ImportNode {
  source: string;
  specifiers: Array<specifierNode>;
}

export interface Component {
  info: ComponentInfo;
  tags: string[];
}
export interface ParseResult {
  ast: File | null;
  importStatements: Array<ImportNode>;
  exportStatements: Array<ExportNode>;
  components: Component[];
}

export interface ComponentInfo {
  name: string;
  start: number | undefined;
  end: number | undefined;
}

export interface ExportNode {
  default: boolean;
  local: string; // case of using ( A as B)
  exported: string;
  loc: {
    start: number | undefined;
    end: number | undefined;
  };
}

export class AstParser {
  private ast: File | null = null;
  private fileContent: string | null = null;
  private filters: { (node: Node): void }[] = [];
  private components: Component[] = [];
  private _components: Array<{ info: ComponentInfo; node: any }> = [];
  private imports: Array<ImportNode> = [];
  private exports: Array<ExportNode> = [];

  constructor() {
    this.initFilters();
  }

  initFilters = () => {
    this.filters = [
      this.importNode,
      this.exportNode,
      this.arrowComponent,
      this.classComponent,
      this.funComponent,
      this.reactDOMNode,
    ];
  };

  clearAll = () => {
    this.components.length = 0;
    this._components.length = 0;
    this.imports.length = 0;
    this.exports.length = 0;
  };

  parse = (content: string, options?: {}) => {
    this.clearAll();
    this.fileContent = content;
    this.parseContent(options);
    this.traverse(this.ast);
    this.resolveTags();

    return {
      importStatements: [...this.imports],
      exportStatements: [...this.exports],
      components: [...this.components],
      ast: this.ast,
    };
  };

  private parseContent(options?: {}) {
    options = {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript"],
      ...options,
    };

    if (this.fileContent) {
      this.ast = parse(this.fileContent, options);
    }
  }

  traverse(node: any, costumFilter?: (filterNode: any) => void) {
    if (Array.isArray(node)) {
      node.forEach((nextNode) => this.traverse(nextNode, costumFilter));
    }

    if (this.isObjectNode(node)) {
      if (costumFilter) {
        costumFilter(node);
      } else {
        this.filters.forEach((filter) => filter(node));
      }

      const nodeKeys = Object.keys(node);
      nodeKeys.forEach((key) => {
        const nextNode = node[key];
        this.traverse(nextNode, costumFilter);
      });
    }
  }

  private resolveTags = () => {
    this._components.forEach(({ info, node }) => {
      const nextComponent: Component = { info, tags: [] };
      this.components.push(nextComponent);
      this.traverse(node, this.JSXTagNode);
    });
  };

  private importNode = (node: Node) => {
    if (node.type === "ImportDeclaration") {
      const { source, specifiers } = node;
      let sps: Array<specifierNode> = [];
      if (isValideImport(source.value)) {
        specifiers.forEach((sp) => {
          let local = "",
            imported = "";
          if (
            sp.type === "ImportSpecifier" &&
            sp.imported.type == "Identifier"
          ) {
            local = sp.local.name;
            imported = sp.imported.name;
          } else if (sp.type === "ImportDefaultSpecifier") {
            local = sp.local.name;
            imported = sp.local.name;
          }
          sps.push({ local, imported });
        });
        this.imports.push({ source: source.value, specifiers: sps });
      }
    }
  };

  private arrowComponent = (node: Node) => {
    if (node.type === "VariableDeclaration") {
      const { declarations } = node;

      declarations.forEach((declaration) => {
        const { init, id, loc } = declaration;
        let component: ComponentInfo = { name: "", start: 0, end: 0 };

        if (id.type === "Identifier") {
          if (loc)
            component = {
              name: id.name,
              start: loc.start.line,
              end: loc.end.line,
            };
        }

        if (init?.type === "ArrowFunctionExpression") {
          const { body } = init;
          if (body.type === "BlockStatement") {
            const { body: bodyRet } = body;

            bodyRet.forEach((bd) => {
              if (bd.type === "ReturnStatement") {
                const { argument } = bd;
                if (
                  argument &&
                  ["JSXFragment", "JSXElement"].includes(argument.type)
                ) {
                  this._components.push({ info: component, node: bd });
                }
              }
            });
          }
        }
      });
    }
  };

  private classComponent = (node: Node) => {
    if (node.type === "ClassDeclaration") {
      const { superClass, loc, id } = node;
      let component: ComponentInfo;
      if (superClass?.type === "Identifier") {
        const { name } = superClass;

        if (loc && name === "Component") {
          // correct class React component
          component = {
            name: id.name,
            start: loc.start.line,
            end: loc.end.line,
          };
          this._components.push({ info: component, node });
        }
      }
      if (superClass?.type === "MemberExpression") {
        const { object, property } = superClass;
        if (
          loc &&
          object.type === "Identifier" &&
          object.name === "React" &&
          property.type === "Identifier" &&
          property.name === "Component"
        ) {
          // correct class React component
          component = {
            name: id.name,
            start: loc.start.line,
            end: loc.end.line,
          };
          this._components.push({ info: component, node });
        }
      }
    }
  };

  private funComponent = (node: Node) => {
    if (node.type === "FunctionDeclaration") {
      const { id, loc, body } = node;
      let component: ComponentInfo;

      if (id?.type === "Identifier" && loc) {
        const { name } = id;
        component = { name, start: loc?.start.line, end: loc.end.line };
      }

      if (body.type === "BlockStatement") {
        const { body: bodyRet } = body;

        bodyRet.forEach((bd) => {
          if (bd.type === "ReturnStatement") {
            const { argument } = bd;
            if (
              argument &&
              ["JSXFragment", "JSXElement"].includes(argument.type)
            ) {
              this._components.push({ info: component, node: bd });
            }
          }
        });
      }
    }
  };

  private JSXTagNode = (node: Node) => {
    if (node.type === "JSXOpeningElement") {
      const { name } = node;
      let jsxTag: string | null = null;

      if (name.type === "JSXIdentifier") {
        const { name: jsx } = name;
        jsxTag = jsx;
      }
      if (
        name.type === "JSXMemberExpression" &&
        name.object.type === "JSXIdentifier"
      ) {
        const { object } = name;
        jsxTag = object.name;
      }

      if (jsxTag && this.isValidJSX(jsxTag)) {
        const componentLn = this.components.length;
        const componentIndex = componentLn > 0 ? componentLn - 1 : componentLn;

        this.components[componentIndex].tags.push(jsxTag);
      }
    }
  };

  private reactDOMNode = (node: Node) => {
    if (node.type === "ExpressionStatement") {
      const { expression, loc } = node;
      if (expression.type === "CallExpression") {
        const { arguments: args, callee } = expression;
        if (callee.type === "MemberExpression") {
          const { object, property } = callee;
          if (object.type === "Identifier" && property.type === "Identifier")
            if (object.name === "ReactDOM" && property.name === "render") {
              this._components.push({
                info: {
                  name: object.name + "." + property.name,
                  start: loc?.start.line,
                  end: loc?.end.line,
                },
                node: args,
              });
            }
        }
      }
    }
  };

  private exportNode = (node: Node) => {
    if (node.type === "ExportDefaultDeclaration") {
      const { loc, declaration } = node;

      if (declaration.type === "Identifier") {
        const { name } = declaration;

        this.exports.push({
          default: true,
          local: name,
          exported: name,
          loc: {
            start: loc?.start.line,
            end: loc?.end.line,
          },
        });
      }
    }

    if (node.type === "ExportNamedDeclaration") {
      const { loc, specifiers } = node;

      specifiers.forEach((specifier) => {
        if (
          specifier.type === "ExportSpecifier" &&
          specifier.exported.type === "Identifier"
        ) {
          const { local, exported } = specifier;

          this.exports.push({
            default: false,
            local: local.name,
            exported: exported.name,
            loc: {
              start: loc?.start.line,
              end: loc?.end.line,
            },
          });
        }
      });
    }
  };

  private isObjectNode = (node: Node) => {
    return node && typeof node === "object" && node.type;
  };

  private isValideImport = (path: string) => {
    return path.startsWith(".");
  };

  private isValidJSX = (name: string) => {
    let isValid = false;
    this.imports.forEach(({ specifiers }) => {
      const found = specifiers.find(({ imported, local }) =>
        [imported, local].includes(name)
      );
      if (found) isValid = true;
    });
    return isValid;
  };
}
