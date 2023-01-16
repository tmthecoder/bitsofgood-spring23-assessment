const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
    /**
     * Sort test to determine order of execution
     * Sorting is applied after sharding
     */
    sort(tests) {
        // Test structure information
        // https://github.com/facebook/jest/blob/6b8b1404a1d9254e7d5d90a8934087a9c9899dab/packages/jest-runner/src/types.ts#L17-L21
        let copyTests = Array.from(tests);
        copyTests = moveTest(copyTests, 0, "user");
        copyTests = moveTest(copyTests, 1, "animal");
        copyTests = moveTest(copyTests, 2, "training");
        return copyTests
    }

}

function moveTest(tests, toIdx, prefix) {
    const testIdx = tests.findIndex((test) => test.path.includes(prefix))
    const test = tests[testIdx];
    tests[testIdx] = tests[toIdx];
    tests[toIdx] = test
    return tests
}


module.exports = CustomSequencer;
