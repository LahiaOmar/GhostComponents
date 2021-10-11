import React from 'react'

class Done extends React.Component {

  render() {
    const donesKeys = Object.keys(this.props.dones)
    return (
      <div className="card card-width">
        <div className="card-header">
          DONE (Y)
        </div>
        <div>
          <ol>
            {donesKeys.map(key => {
              return (
                <li key={key}>
                  {this.props.dones[key]}
                </li>
              )
            }
            )}
          </ol>
        </div>
      </div>
    )
  }
}

export default Done