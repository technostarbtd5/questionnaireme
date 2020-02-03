import React, { Component } from "react";
import logo from "../logo.svg";
import "../App.css";
import QuestionMCOption from "./questionMCOption";
//import NavBar from "./components/navbar";
//import Counters from "./components/counters";

class Owner extends Component {
  state = {
    groupName: "",
    selectedTab: "questions",
    memberCount: 0,
    questions: [
      {
        _id: 0,
        questionText: "Text text",
        mode: "multiple_choice",
        options: [
          {
            optionText: "Test option text",
            optionID: 0,
            isCorrect: true
          },
          {
            optionText: "Test option text2",
            optionID: 1,
            isCorrect: false
          },
          {
            optionText: "Test option text3",
            optionID: 2,
            isCorrect: false
          }
        ]
      }
    ]
  };

  /*constructor() {
    super();
    console.log("App - constructor");
  }*/

  /*componentDidMount() {
    // Useful for Ajax calls
    //this.setState({})
    console.log("App - mounted");
  }*/

  /*componentDidUpdate(prevProps, prevState) {
    // Can do Ajax request if there's a change between previous and current props/state
    // if (prevProps.counter.value !== this.props.counter.value) ...
  }*/

  /*componentWillUnmount() {
    // Called just prior to being removed from DOM
  }*/

  /*handleReset = () => {
    const counters = this.state.counters.map(c => {
      c.value = 0;
      return c;
    });
    this.setState({ counters });
  };

  handleDelete = id => {
    console.log("deleting ", id);
  };

  handleIncrement = counter => {
    console.log("Increment Clicked", counter);
    const counters = [...this.state.counters];
    const index = counters.indexOf(counter);
    counters[index] = { ...counter };
    counters[index].value++;
    this.setState({ counters });
  };*/

  handleDelete = id => {
    console.log("deleting ", id);
  };

  submitQuestionText = (text, index) => {
    console.log(text);
    console.log(index);
  };

  //Child components are rendered recursively
  render() {
    /*const testQuestion = {
      _id: 0,
      questionText: "Text text",
      mode: "multiple_choice",
      options: [
        {
          optionText: "Test option text",
          optionID: 0,
          isCorrect: true
        },
        {
          optionText: "Test option text2",
          optionID: 1,
          isCorrect: false
        }
      ]
    };*/
    console.log("Options length ", this.state.questions[0].options.length);
    return (
      /*<React.Fragment>
        <NavBar
          totalCounters={this.state.counters.filter(c => c.value > 0).length}
        />
        <main className="container">
          <Counters
            counters={this.state.counters}
            onReset={this.handleReset}
            onIncrement={this.handleIncrement}
            onDelete={this.handleDelete}
          />
        </main>
      </React.Fragment>*/

      /*
      <QuestionMCOption
        onSubmitQuestionText={this.submitQuestionText}
        optionIndex={0}
        optionID={0}
        question={testQuestion}
        onDelete={this.handleDelete}
      />
      */
      <div>
        {this.state.questions[0].options.map((option, index) => (
          <QuestionMCOption
            onSubmitQuestionText={this.submitQuestionText}
            optionIndex={index}
            optionID={option.optionID}
            question={this.state.questions[0]}
            onDelete={this.handleDelete}
          />
        ))}

        <QuestionMCOption
          onSubmitQuestionText={this.submitQuestionText}
          optionIndex={this.state.questions[0].options.length}
          optionID={
            /*this.state.questions[0].options.reduce((maxID, option) => {
              return option.optionID > maxID ? option.optionID : maxID;
            }, -1) + 1*/
            this.state.questions[0].options.length
          }
          question={this.state.questions[0]}
          onDelete={this.handleDelete}
        />
      </div>
    );
  }
}

export default Owner;
