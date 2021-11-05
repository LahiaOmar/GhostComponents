import React from 'react';
import Action from './component/Action'
import DoAction from './component/DoAction'
import Done from './component/Done'

import './App.css';
class App extends React.Component {
  state = {
    actions: {},
    dones: {}
  }

  addActions = (act) => {
    const actions = { ...this.state.actions }
    actions[Date.now()] = act
    this.setState({ actions })
  }

  addDones = (done) => {
    console.log("add Done : ", done)
    const dones = { ...this.state.dones }
    dones[Date.now()] = done
    this.setState({ dones })
  }



  deleteAction = (key) => {
    console.log("delete action APP", key)
    const actions = { ...this.state.actions }
    delete actions[key]
    this.setState({ actions })
  }

  render() {
    const actionsKeys = Object.keys(this.state.actions)
    return (
      <div className="App row flex-center flex-spaces card-height" >
        <Action addActions={this.addActions} />
        <DoAction deleteAction={this.deleteAction} actions={this.state.actions} addDones={this.addDones} />
        <Done dones={this.state.dones} />
      </div>
    )
  }

}

export default App;
