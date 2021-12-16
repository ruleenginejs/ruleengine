const debug = require("..")("ruleengine")
const {
  Pipeline,
  StartStep,
  EndStep,
  SingleStep,
  CompositeStep
} = require("@ruleenginejs/runtime")

const pipe = new Pipeline();
const start = new StartStep({ id: 1, name: "start" });
const end = new EndStep({ id: 3, name: "end" });

const composite = new CompositeStep({ id: 2, name: "composite step" });
const subStep = new SingleStep({ id: "2.1" });
composite.setStartStep(subStep).setEndStep(subStep);

start.connectTo(composite);
composite.connectTo(end);
pipe.add(start, composite, end);

debug(pipe, "composite");
pipe.execute();
