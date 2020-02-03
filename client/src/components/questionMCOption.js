import React, { Component } from "react";

class QuestionMCOption extends Component {
  state = {
    value: this.props.optionText
  };
  constructor(props) {
    super(props);
    /*this.state = {
      value: "" //props.question.options[props.optionIndex].optionText
    };*/

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = props.onSubmitQuestionOptionText.bind(this);
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  //constructor() {
  //  super();
  //  this.handleIncrement = this.handleIncrement.bind(this);
  //}

  render() {
    return (
      <div className="row">
        <div className="col-sm-2"></div>
        <div className="col-sm-8">
          <form
            id="form"
            onSubmit={event => {
              if (event) event.preventDefault();
              this.props.onSubmitQuestionOptionText(
                this.state.value,
                this.props.optionIndex
              );
            }}
            onChange={this.handleChange}
          >
            <div className="form-group row">
              <label htmlFor="option-text" className="col-lg-2 col-form-label">
                Option {this.props.optionID}
              </label>
              <div className="col-sm-5">
                <input
                  type="text"
                  className="form-control"
                  id="optionUserInput"
                  value={this.props.optionText}
                />
              </div>
              <div className="col-lg-2">{this.formatSubmitButton()}</div>
              <div className="col-lg-2">
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="inlineCheckbox1"
                    value="Correct Answer"
                  />
                  <label className="form-check-label" htmlFor="inlineCheckbox1">
                    Correct Answer
                  </label>
                </div>
              </div>
              <div className="col-lg-1">
                <button
                  onClick={() => this.props.onDelete(this.props.optionIndex)}
                  className="btn btn-danger btn-sm m-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-sm-2"></div>
      </div>
    );
  }
  //{this.props.children}
  //{this.state.tags.length === 0 && <p>Please create a new tag!</p>}
  //<ul>
  //  {this.props.state.map(tag => (
  //    <li key={tag}>{tag}</li>
  //  ))}
  ///ul>

  /*getBadgeClasses() {
    let classes = "badge m-2 badge-";
    classes += this.props.counter.value === 0 ? "warning" : "primary";
    return classes;
  }

  formatCount() {
    const { value } = this.props.counter;
    return value === 0 ? "Empty" : value;
  }*/

  formatSubmitButton() {
    console.log(
      "Comparing " +
        this.props.question.options.length +
        " and " +
        this.props.optionIndex
    );
    if (this.props.question.options.length > this.props.optionIndex) {
      return (
        <button type="submit" className="btn btn-info btn-sm m-2">
          Update
        </button>
      );
    } else {
      return (
        <button type="submit" className="btn btn-success btn-sm m-2">
          Create
        </button>
      );
    }
  }
}

export default QuestionMCOption;
