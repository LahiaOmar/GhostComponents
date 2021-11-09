import React from 'react'

class ClassComponent extends React.Component {
  render() {
    return (
      <div>
        Class Component
      </div>
    )
  }
}

function FunctionComponent() {
  return (
    <div>
      Function Component
    </div>
  )
}

const arrowFunctionComponent = () => {
  return (
    <div>
      Arrow Function Component
    </div>
  )
}