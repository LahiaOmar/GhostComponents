import React from 'react'
import Header from './Header/Header'
class DoAction extends React.Component {
  done = (key) => {
    // event.preventDefault()
    console.log("Action DONE : ", key)
    this.props.deleteAction(key)
    this.props.addDones(this.props.actions[key])
  }
  render() {
    const actionsKeys = Object.keys(this.props.actions)
    return (
      < div className="card card-width">
        <Header />
        <div className="card-header">DOING</div>
        <ol>
          {actionsKeys.map(key => {
            return (
              <div className="row flex-spaces" key={key}>
                <li className="margin-top-small"> {this.props.actions[key]} </li>
                <button className="btn-small" onClick={() => this.done(key)}> DONE / REMOVE </button>
              </div>
            )
          })}
        </ol>
      </div>
    )
  }
}

export default DoAction