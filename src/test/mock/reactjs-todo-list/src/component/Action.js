import React from 'react'

class Action extends React.Component {
  inpMsg = React.createRef()

  handleAdd = (event) => {
    event.preventDefault()
    console.log(event)
    console.log(this.inpMsg.current.value)
    this.props.addActions(this.inpMsg.current.value)
    this.inpMsg.current.value = ""
  }

  render() {
    return (
      <form onSubmit={this.handleAdd} className="card card-width">
        <div className="card-header">TO-DO</div>
        <br />
        <div className="row flex-spaces">
          <input type="text" ref={this.inpMsg}></input>
          <button className="btn-small"
            onClick={this.handleAdd}>ADD THIS ACTION </button>
        </div>
      </form>
    )
  }
}

export default Action