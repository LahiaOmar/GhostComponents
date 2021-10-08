import {parse, ParserOptions} from '@babel/parser'
import {
  ExportSpecifier,
  ExportDefaultSpecifier,
  ExportNamespaceSpecifier,
  ImportSpecifier, 
  ImportDefaultSpecifier,
  FunctionDeclaration, 
  TSDeclareFunction, 
  ClassDeclaration, 
  Expression, 
  ImportNamespaceSpecifier,
  File} from '@babel/types'
import traverse from '@babel/traverse'


const isValideImport = (imp:string) => {
  return imp.startsWith('.')
}

/**
 * 
 * @param {String} file 
 * @paran {Object} options
 */

interface ImportNode {
  source: string,
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>
}

interface ExportNode { 
  specifiers?: Array<ExportSpecifier | ExportDefaultSpecifier | ExportNamespaceSpecifier>;
  declaration?: FunctionDeclaration | TSDeclareFunction | ClassDeclaration | Expression;
}

interface ParseResult {
  ast: File,
  importStatement: Array<ImportNode>,
  JSXtags: Array<string>,
  exportStatements: Array<ExportNode>
}

export const fileASTparser = (file:string, options:ParserOptions) : ParseResult => {
  options = { sourceType: 'module', plugins: ['jsx'], ...options }
  const ast:File = parse(file, options)

  let importStatement:Array<ImportNode> = []
  let JSXtags:Array<string> = []
  let exportStatements:Array<ExportNode> = []

  traverse(ast, {
    ImportDeclaration({node}) {
      const { source, specifiers } = node
      if(isValideImport(source.value)){
        importStatement.push({source: source.value, specifiers: specifiers})
      }
    },
    JSXOpeningElement({node}) {
      const {name} = node
      if(name.type === "JSXMemberExpression"){
        const {object} = name
        if(object.type === "JSXIdentifier"){
          JSXtags.push(object.name)
        }
      }
      else if(node.type === "JSXOpeningElement" && typeof name.name === 'string' ){
        const { name:jsxName } = name
        JSXtags.push(jsxName)
      } 
    },
    ExportNamedDeclaration(path) {
      const { loc, specifiers } = path.node
      exportStatements.push({ specifiers })
    },
    ExportDefaultDeclaration(path) {
      const { loc, declaration } = path.node
      exportStatements.push({ declaration })
    }
  });

  return {
    ast,
    importStatement,
    JSXtags,
    exportStatements
  }
}

