const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const io = require("socket.io")(http);

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const path = require("path");
const Joi = require("joi");

const db = require("./db");
const groups = "groups";
const members = "members";

const schemaGroupCreate = Joi.object().keys({
  groupName: Joi.string().required(),
  location: Joi.object().keys({
    lat: Joi.number()
      .min(-90)
      .max(90)
      .required(),
    lon: Joi.number()
      .min(-180)
      .max(180)
      .required()
  })
});

const schemaGroupJoin = Joi.object().keys({
  name: Joi.string().required()
});

const schemaCreateQuestion = Joi.object().keys({
  questionText: Joi.string().required(),
  mode: Joi.string().required(),
  options: Joi.array().items(
    Joi.object().keys({
      optionText: Joi.string().required(),
      optionID: Joi.number().required(),
      isCorrect: Joi.boolean().required()
    })
  )
});

const schemaUpdateQuestion = Joi.object().keys({
  _id: Joi.number().required(),
  questionText: Joi.string().required(),
  mode: Joi.string().required(),
  options: Joi.array().items(
    Joi.object().keys({
      optionText: Joi.string().required(),
      optionID: Joi.number().required(),
      isCorrect: Joi.boolean().required()
    })
  )
});

const schemaActivateQuestion = Joi.object().keys({
  questionID: Joi.number().required()
});

const schemaAnswerQuestion = Joi.object().keys({
  memberID: Joi.number().required(),
  optionID: Joi.number().required(),
  responseText: Joi.string().required()
});

const schemaDeleteAnswer = Joi.object().keys({
  memberID: Joi.number().required(),
  questionID: Joi.number().required()
});

const schemaDeleteQuestion = Joi.object().keys({
  questionID: Joi.number().required()
});

// Temporary
app.get("/api/hello", (req, res) => {
  res.send({ express: "Hello From Express" });
});

app.post("/api/world", (req, res) => {
  console.log(req.body);
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`
  );
});

// Use socket for handling client updates
io.on("connection", socket => {
  console.log("User connected to server.");
});

// Debug screen
app.get("/getGroupsJSON", (req, res) => {
  db.getDB()
    .collection(groups)
    .find({})
    .toArray((err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(docs);
        res.json(docs);
      }
    });
});

// Post req for group creation
app.post("/api/group/create", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaGroupCreate, (err, result) => {
    if (err) {
      const error = new Error("Invalid group creation input.");
      error.status = 400;
      next(error);
    } else {
      input.members = [];
      input.questions = [];
      input.memberCount = 0;
      input.questionCount = 0;
      input.activeQuestionID = -1; // -1 is no active question
      db.getDB()
        .collection(groups)
        .insertOne(input, (err, result) => {
          if (err) {
            const error = new Error("Failed to create group in database");
            error.status = 400;
          } else {
            res.json({
              result: result,
              document: result.ops[0],
              msg: "Successfully created group!",
              error: null
            });
          }
        });
    }
  });
});

// Delete request to clear a whole group.
app.delete("/api/group/delete/:id", (req, res) => {
  db.getDB()
    .collection(groups)
    .findOneAndDelete(
      { _id: db.getPrimaryKey(req.params.id) },
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.json(result);
        }
      }
    );
});

// Post request for adding a question to the database.
// Submit with an options array if mode === "multiple_choice"
// Submit without an options array otherwise
app.post("/api/group/create/question/:id", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaCreateQuestion, (err, result) => {
    if (err) {
      const error = new Error("Invalid group creation input.");
      error.status = 400;
      next(error);
    } else {
      // Query database to get group info
      db.getDB()
        .collection(groups)
        .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
          if (err) {
            const error = new Error("Failed to find group in database");
            error.status = 400;
          } else {
            input._id = result.questionCount;
            input.memberResponses = [];
            console.log(input);
            // Push question into database
            db.getDB()
              .collection(groups)
              .findOneAndUpdate(
                { _id: db.getPrimaryKey(req.params.id) },
                { $push: { questions: input }, $inc: { questionCount: 1 } },
                { returnOriginal: false },
                (err2, result2) => {
                  if (err2) {
                    const error = new Error("Failed to add question to group");
                    error.status = 400;
                  } else {
                    res.json({
                      result: result2,
                      document: result2,
                      msg: "Successfully added question to database!",
                      error: null
                    });
                  }
                }
              );
          }
        });
    }
  });
});

app.put("/api/group/create/updateQuestion/:id", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaUpdateQuestion, (err, result) => {
    if (err) {
      const error = new Error("Invalid question update input.");
      error.status = 400;
      next(error);
    } else {
      // Query database to get group info
      db.getDB()
        .collection(groups)
        .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
          if (err) {
            const error = new Error("Failed to find group in database");
            error.status = 400;
          } else {
            var success = false;
            result.questions.forEach((item, i) => {
              if (item._id == input._id) {
                result.questions[i] = input;
                success = true;
              }
            });

            console.log(input);
            // Push question into database
            if (success) {
              db.getDB()
                .collection(groups)
                .findOneAndUpdate(
                  { _id: db.getPrimaryKey(req.params.id) },
                  { $set: { questions: result.questions } },
                  { returnOriginal: false },
                  (err2, result2) => {
                    if (err2) {
                      const error = new Error(
                        "Failed to add question to group"
                      );
                      error.status = 400;
                    } else {
                      res.json({
                        result: result2,
                        document: result2,
                        msg: "Successfully updated question in database!",
                        error: null
                      });
                    }
                  }
                );
            } else {
              const error = new Error("Failed to locate question in group.");
              error.status = 400;
            }
          }
        });
    }
  });
});

app.put("/api/group/create/deleteQuestion/:id", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaDeleteQuestion, (err, result) => {
    if (err) {
      const error = new Error("Invalid question deletion input.");
      error.status = 400;
      next(error);
    } else {
      // Query database to get group info
      db.getDB()
        .collection(groups)
        .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
          if (err) {
            const error = new Error("Failed to find group in database");
            error.status = 400;
          } else {
            var success = false;
            // Delete question from database
            var tempQuestions = [];
            result.questions.forEach((item, i) => {
              if (item._id != input.questionID) {
                tempQuestions.push(item);
              } else {
                success = true;
              }
            });
            result.questions = tempQuestions;

            // Delete associated member responses
            result.members.forEach((item, i) => {
              item.questionResponses = item.questionResponses.filter(
                response => response.questionID != input.questionID
              );
            });

            console.log(input);
            // Push updated group into database
            if (success) {
              db.getDB()
                .collection(groups)
                .findOneAndUpdate(
                  { _id: db.getPrimaryKey(req.params.id) },
                  { $set: { questions: result.questions } },
                  { returnOriginal: false },
                  (err2, result2) => {
                    if (err2) {
                      const error = new Error(
                        "Failed to remove question from group"
                      );
                      error.status = 400;
                    } else {
                      res.json({
                        result: result2,
                        document: result2,
                        msg: "Successfully deleted question from database!",
                        error: null
                      });
                    }
                  }
                );
            } else {
              const error = new Error("Failed to locate question in group.");
              error.status = 400;
            }
          }
        });
    }
  });
});
// Post request for joining a group
app.post("/api/group/join/:id", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaGroupJoin, (err, result) => {
    if (err) {
      const error = new Error("Invalid group creation input.");
      error.status = 400;
      next(error);
    } else {
      // Query database for group info
      db.getDB()
        .collection(groups)
        .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
          if (err) {
            const error = new Error("Failed to find group in database");
            error.status = 400;
          } else {
            input._id = result.memberCount;
            input.questionResponses = [];
            console.log(input);
            // Insert member into database
            db.getDB()
              .collection(groups)
              .findOneAndUpdate(
                { _id: db.getPrimaryKey(req.params.id) },
                { $push: { members: input }, $inc: { memberCount: 1 } },
                { returnOriginal: false },
                (err2, result2) => {
                  if (err2) {
                    const error = new Error("Failed to add member to group");
                    error.status = 400;
                  } else {
                    res.json({
                      result: result2,
                      document: result2,
                      msg: "Successfully added member to database!",
                      error: null
                    });
                  }
                }
              );
          }
        });
    }
  });
});

// Fetch the active question from the server.
// TODO: Implement socket version of this once front-end is available
app.get("/api/group/active/getQuestion/:id", (req, res) => {
  db.getDB()
    .collection(groups)
    .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        // Return JSON instance of the question
        const activeQuestion = result.questions.filter(
          question => question._id == result.activeQuestionID
        );
        if (activeQuestion.length > 0) {
          res.json(activeQuestion[0]);
        } else {
          res.json({});
        }
      }
    });
});

// Post request for activating a question.
app.post("/api/group/active/postQuestion/:id", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaActivateQuestion, (err, result) => {
    if (err) {
      const error = new Error("Invalid question activation input.");
      error.status = 400;
      next(error);
    } else {
      // Query database for group info
      db.getDB()
        .collection(groups)
        .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
          if (err) {
            const error = new Error("Failed to find group in database");
            error.status = 400;
          } else {
            // Using the result and the question ID, search for the corresponding question object
            // If question is found, then update activeQuestionID
            if (
              result.questions.filter(
                question => question._id == input.questionID
              ).length > 0
            ) {
              db.getDB()
                .collection(groups)
                .findOneAndUpdate(
                  { _id: db.getPrimaryKey(req.params.id) },
                  { $set: { activeQuestionID: input.questionID } },
                  { returnOriginal: false },
                  (err2, result2) => {
                    if (err2) {
                      const error = new Error("Failed to add member to group");
                      error.status = 400;
                    } else {
                      res.json({
                        result: result2,
                        document: result2,
                        msg: "Successfully added member to database!",
                        error: null
                      });
                    }
                  }
                );
            } else {
              const error = new Error("Failed to find question with given ID");
              error.status = 400;
            }
          }
        });
    }
  });
});

// Respond to question
app.post("/api/group/active/postAnswer/:id", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaAnswerQuestion, (err, result) => {
    if (err) {
      const error = new Error("Invalid answer input.");
      error.status = 400;
      next(error);
    } else {
      // Query database for group info
      db.getDB()
        .collection(groups)
        .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
          if (err) {
            const error = new Error("Failed to find group in database");
            error.status = 400;
          } else {
            const activeQuestion = result.questions.filter(
              question => question._id == result.activeQuestionID
            );

            if (
              result.members.filter(member => member._id == input.memberID)
                .length > 0 &&
              activeQuestion.length > 0 &&
              (result.questions[result.activeQuestionID].options.filter(
                option => option.optionID == input.optionID
              ).length > 0 ||
                result.questions[result.activeQuestionID].mode !=
                  "multiple_choice")
            ) {
              const memberResponsesInput = {
                questionID: result.activeQuestionID,
                optionID: input.optionID,
                responseText: input.responseText
              };
              const questionResponsesInput = {
                memberID: input.memberID,
                optionID: input.optionID,
                responseText: input.responseText
              };
              // Identify whether the member has already answered the given question.
              // If true, set value rather than update value
              if (
                result.questions[
                  result.activeQuestionID
                ].memberResponses.filter(
                  response =>
                    response.memberID == questionResponsesInput.memberID
                ).length > 0
              ) {
                // Question already answered, update instead
                console.log("Question answered already! Updating in database.");

                var updatedGroup = result;
                updatedGroup.questions[
                  result.activeQuestionID
                ].memberResponses.forEach((item, i) => {
                  if (item.memberID == input.memberID) {
                    updatedGroup.questions[
                      result.activeQuestionID
                    ].memberResponses[i] = questionResponsesInput;
                  }
                });
                updatedGroup.members[input.memberID].questionResponses.forEach(
                  (item, i) => {
                    if (item.questionID == result.activeQuestionID) {
                      updatedGroup.members[input.memberID].questionResponses[
                        i
                      ] = memberResponsesInput;
                    }
                  }
                );

                db.getDB()
                  .collection(groups)
                  .findOneAndUpdate(
                    { _id: db.getPrimaryKey(req.params.id) },
                    {
                      $set: {
                        members: updatedGroup.members,
                        questions: updatedGroup.questions
                      }
                    },
                    { returnOriginal: false },
                    (err2, result2) => {
                      if (err2) {
                        const error = new Error(
                          "Failed to update member response to question"
                        );
                        error.status = 400;
                      } else {
                        res.json({
                          result: result2,
                          document: result2,
                          msg:
                            "Successfully updated member response to question!",
                          error: null
                        });
                      }
                    }
                  );
              } else {
                // Add response to questions
                db.getDB()
                  .collection(groups)
                  .findOneAndUpdate(
                    {
                      _id: db.getPrimaryKey(req.params.id),
                      "questions._id": result.activeQuestionID
                    },
                    {
                      $push: {
                        "questions.$.memberResponses": questionResponsesInput
                      }
                    },
                    { returnOriginal: false },
                    (err2, result2) => {
                      if (err2) {
                        const error = new Error(
                          "Failed to add response to question"
                        );
                        error.status = 400;
                      } else {
                        // Add response to member info
                        db.getDB()
                          .collection(groups)
                          .findOneAndUpdate(
                            {
                              _id: db.getPrimaryKey(req.params.id),
                              "members._id": input.memberID
                            },
                            {
                              $push: {
                                "members.$.questionResponses": memberResponsesInput
                              }
                            },
                            { returnOriginal: false },
                            (err2, result2) => {
                              if (err2) {
                                const error = new Error(
                                  "Failed to add response to member"
                                );
                                error.status = 400;
                              } else {
                                res.json({
                                  result: result2,
                                  document: result2,
                                  msg:
                                    "Successfully added response to database!",
                                  error: null
                                });
                              }
                            }
                          );
                      }
                    }
                  );
              }
            } else {
              const error = new Error(
                "Failed to find member or question with given ID"
              );
              error.status = 400;
            }
          }
        });
    }
  });
});

app.put("/api/group/active/deleteAnswer/:id", (req, res, next) => {
  const input = req.body;
  Joi.validate(input, schemaDeleteAnswer, (err, result) => {
    if (err) {
      const error = new Error("Invalid answer input.");
      error.status = 400;
      next(error);
    } else {
      // Query database for group info
      db.getDB()
        .collection(groups)
        .findOne({ _id: db.getPrimaryKey(req.params.id) }, (err, result) => {
          if (err) {
            const error = new Error("Failed to find group in database");
            error.status = 400;
          } else {
            const activeQuestion = result.questions.filter(
              question => question._id == input.questionID
            );

            if (
              result.members.filter(member => member._id == input.memberID)
                .length > 0 &&
              activeQuestion.length > 0
            ) {
              // Identify whether the member has already answered the given question.
              // If true, set value rather than update value
              if (
                result.questions[input.questionID].memberResponses.filter(
                  response => response.memberID == input.memberID
                ).length > 0
              ) {
                // Question already answered, update instead
                console.log("Question answered already! Updating in database.");

                var updatedGroup = result;
                updatedGroup.questions[
                  input.questionID
                ].memberResponses = updatedGroup.questions[
                  input.questionID
                ].memberResponses.filter(
                  response => response.memberID != input.memberID
                );
                updatedGroup.members[
                  input.memberID
                ].questionResponses = updatedGroup.members[
                  input.memberID
                ].questionResponses.filter(
                  response => response.questionID != input.questionID
                );
                db.getDB()
                  .collection(groups)
                  .findOneAndUpdate(
                    { _id: db.getPrimaryKey(req.params.id) },
                    {
                      $set: {
                        members: updatedGroup.members,
                        questions: updatedGroup.questions
                      }
                    },
                    { returnOriginal: false },
                    (err2, result2) => {
                      if (err2) {
                        const error = new Error(
                          "Failed to update member response to question"
                        );
                        error.status = 400;
                      } else {
                        res.json({
                          result: result2,
                          document: result2,
                          msg:
                            "Successfully updated member response to question!",
                          error: null
                        });
                      }
                    }
                  );
              } else {
                const error = new Error(
                  "Failed to find member's answer to question"
                );
                error.status = 400;
              }
            } else {
              const error = new Error(
                "Failed to find member or question with given ID"
              );
              error.status = 400;
            }
          }
        });
    }
  });
});

db.connect(err => {
  if (err) {
    console.log("unable to connect to database");
    process.exit(1);
  } else {
    app.listen(port, () => {
      console.log("connected to database, listening on port 3000");
    });
  }
});
