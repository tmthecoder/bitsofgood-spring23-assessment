const Sequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends Sequencer {
  // Need a custom sort for tests as it needs to run in below order:
  // Order: User -> Animal -> Training -> Upload
  sort(tests) {
    let copyTests = Array.from(tests);
    copyTests = moveTest(copyTests, 0, "user");
    copyTests = moveTest(copyTests, 1, "animal");
    copyTests = moveTest(copyTests, 2, "training");
    return copyTests;
  }
}

function moveTest(tests, toIdx, prefix) {
  const testIdx = tests.findIndex((test) => test.path.includes(prefix));
  const test = tests[testIdx];
  tests[testIdx] = tests[toIdx];
  tests[toIdx] = test;
  return tests;
}

module.exports = CustomSequencer;
