const { Emitter } = require("./emitter");

const testListener = () => {
  Emitter.on("test", () => {
    console.log("email sent");
  });
};

module.export = {
  testListener,
};
