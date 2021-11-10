import { isValideImport } from '../helpers/fs'
import { 
  ImportDeclaration, 
  JSXOpeningElement,
  ExportNamedDeclaration,
  ExportDefaultDeclaration,
  VariableDeclaration, 
  ClassDeclaration, 
  FunctionDeclaration,
  Node
} from '@babel/types'

interface specifierNode {
  local: string, 
  imported: string
}

interface ComponentInfo {
  name: string,
  start: number,
  end: number
}

const nodesTypes = [
  'ImportDeclaration',
  'JSXOpeningElement',
  'ExportNamedDeclaration',
  'ExportDefaultDeclaration',
  'VariableDeclaration',
  'ClassDeclaration',
  'FunctionDeclaration',
]


export const importNode  = (node:ImportDeclaration, result:Function) => {
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
    result({source, specifiers: sps})
  }
}

export const JSXTagNode = (node:JSXOpeningElement, result:Function) => {
  const {name} = node
  if(name.type === "JSXMemberExpression"){
    const {object} = name
    if(object.type === "JSXIdentifier"){
      result(object.name)
    }
  }
  else if(node.type === "JSXOpeningElement" && typeof name.name === 'string' ){
    const { name:jsxName } = name
    return result(jsxName)
  } 
  return result(null)
}

export const exportNode = (node: ExportDefaultDeclaration | ExportNamedDeclaration) => {
  if(node.type === 'ExportDefaultDeclaration'){
    const { loc, declaration } = node
    return { declaration }
  }
  if(node.type === "ExportNamedDeclaration"){
    const { loc, specifiers } = node
    return { specifiers }
  }
}

export const arrowFunComponent = (node:VariableDeclaration) => {
  const { declarations } = node

  declarations.forEach((declaration) => {
    const { init, id, loc } = declaration
    let component: ComponentInfo = { name: '', start: 0, end: 0 }

    if (id.type === 'Identifier') {
      if (loc)
        component = { name: id.name, start: loc.start.line, end: loc.end.line }
    }

    if (init?.type === 'ArrowFunctionExpression') {
      const { body } = init
      if (body.type === "BlockStatement") {
        const { body: bodyRet } = body

        bodyRet.forEach(bd => {
          if (bd.type === "ReturnStatement") {
            const { argument } = bd

            if (argument && argument.type === "JSXFragment") {
              // its a true component
              return component
            }
            if (argument && argument.type === "JSXElement") {
              // its a true component
              return component
            }
            if (argument && argument.type === "Identifier") {
              // its a true component
              const { name } = argument
              if (name === 'children') {
                // true component
                return component
              }
            }
          }
        })
      }
    }
  })
}
export const classFunComponent = (node:ClassDeclaration) => {
  const { superClass, loc, id } = node
  if (superClass?.type === 'Identifier') {
    const { name } = superClass
    let component: ComponentInfo

    if (loc && name === 'Component') {
      // correct class React component
      return { name: id.name, start: loc.start.line, end: loc.end.line }
    }
  }
  if (superClass?.type === "MemberExpression") {
    const { object, property } = superClass
    if (
      loc &&
      object.type === "Identifier" && object.name === "React" &&
      property.type === "Identifier" && property.name === "Component"
    ) {
      // correct class React component 
      return { name: id.name, start: loc.start.line, end: loc.end.line }
    }
  }
}
export const funComponent = (node:FunctionDeclaration) => {
  const { id, loc, body } = node
  let component: ComponentInfo

  if (id?.type === "Identifier" && loc) {
    const { name } = id
    component = { name, start: loc?.start.line, end: loc.end.line }
  }

  if (body.type === "BlockStatement") {
    const { body: bodyRet } = body

    bodyRet.forEach(bd => {
      if (bd.type === "ReturnStatement") {
        const { argument } = bd

        if (argument && argument.type === "JSXFragment") {
          // its a true component
          return component
        }
        if (argument && argument.type === "JSXElement") {
          // its a true component
          return component
        }
        if (argument && argument.type === "Identifier") {
          // its a true component
          const { name } = argument
          if (name === 'children') {
            // true component
            return component
          }
        }
      }
    })
  }
}

const isValideNodeReactDOM  = (node:Node) => {
  let valide = false
  let argumentNode:Array<any> = []
  
  if(node.type === 'ExpressionStatement'){
    const {expression} = node
    if(expression.type === 'CallExpression'){
      const { arguments:args, callee } = expression
      if(callee.type === "MemberExpression"){
        const {object, property} = callee
        if(object.type === "Identifier" && property.type === "Identifier")
          if(object.name === "ReactDOM" && property.name === "render"){
            valide = true     
            argumentNode = args       
          }
      }
    }
  }
  return {valide, argumentNode}
}

export const ReactDOMNode = (node:Node, result:Function) => {
  if(node.type === 'ExpressionStatement'){
    const {expression} = node
    if(expression.type === 'CallExpression'){
      const { arguments:args, callee } = expression
      if(callee.type === "MemberExpression"){
        const {object, property} = callee
        if(object.type === "Identifier" && property.type === "Identifier")
          if(object.name === "ReactDOM" && property.name === "render"){
            
            const JSXElement = args.find(node => {
              return (node.type == "JSXElement")
            })
            
          }
      }
    }
  }
}



const typesCallbacks = {
  'ImportDeclaration': importNode,
  'JSXOpeningElement': JSXTagNode,
  'ExportNamedDeclaration': exportNode,
  'ExportDefaultDeclaration': exportNode,
  'VariableDeclaration': arrowFunComponent,
  'ClassDeclaration': classFunComponent,
  'FunctionDeclaration': funComponent,
}