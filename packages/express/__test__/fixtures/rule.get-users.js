const {
  Pipeline,
  StartStep,
  EndStep,
  SingleStep
} = require("@ruleenginejs/runtime");

const dbUsers = require("./db/users.json");

const pipeline = new Pipeline();
const start = new StartStep();
const end = new EndStep();
const dbStep = new SingleStep({
  handler: ({ data }, next) => {
    data.users = dbUsers;
    next();
  }
});
const respStep = new SingleStep({
  handler: ({ res, data }, port, props, next) => {
    res.statusCode = 200;
    res.end(JSON.stringify(data[props.dataKey]));
    next();
  },
  props: {
    dataKey: "users"
  }
});

start.connectTo(dbStep);
dbStep.connectTo(respStep);
respStep.connectTo(end);

pipeline.add(start, end, dbStep, respStep);

module.exports = pipeline;
