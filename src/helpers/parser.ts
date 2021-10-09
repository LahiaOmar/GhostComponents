import {parse, ParserOptions} from '@babel/parser'
import {
  ExportSpecifier,
  ExportDefaultSpecifier,
  ExportNamespaceSpecifier,
  FunctionDeclaration, 
  TSDeclareFunction, 
  ClassDeclaration, 
  Expression, 
  File} from '@babel/types'
import traverse from '@babel/traverse'

import { isValideImport } from '../helpers/fs'

type specifierNode = {local: string, imported: string}
interface ImportNode {
  source: string,
  specifiers: Array<specifierNode>
}
interface ExportNode { 
  specifiers?: Array<ExportSpecifier | ExportDefaultSpecifier | ExportNamespaceSpecifier>;
  declaration?: FunctionDeclaration | TSDeclareFunction | ClassDeclaration | Expression;
}
export interface ParseResult {
  ast: File,
  importStatement: Array<ImportNode>,
  JSXtags: Array<string>,
  exportStatements: Array<ExportNode>
}

/**
 * Transform a file to an AST structure
 * @param {String} file - file content 
 * @param {Object} options - parsing content
*/

export const fileASTparser = (file:string, options:ParserOptions) : ParseResult => {
  options = { sourceType: 'unambiguous', plugins: ['jsx','typescript'], ...options }
  const ast:File = parse(file, options)

  let importStatement:Array<ImportNode> = []
  let JSXtags:Array<string> = []
  let exportStatements:Array<ExportNode> = []

  traverse(ast, {
    ImportDeclaration({node}) {
      const { source, specifiers } = node
      let sps:Array<specifierNode> = []

      if(isValideImport(source.value)){
        specifiers.forEach(sp => {
          let local = '', imported = ''
          if(sp.type === "ImportSpecifier" && sp.imported.type == "Identifier"){
            local = sp.local.name
            imported = sp.imported.name
          }
          else if(sp.type === "ImportDefaultSpecifier"){
            local = sp.local.name
            imported = sp.local.name
          }
          sps.push({local, imported})
        })
        importStatement.push({source: source.value, specifiers: sps})
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

