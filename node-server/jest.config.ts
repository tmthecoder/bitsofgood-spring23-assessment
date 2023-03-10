import { defaults as tsjPreset } from 'ts-jest/presets';

export default {
  preset: "@shelf/jest-mongodb",
  transform: tsjPreset.transform,
  coverageProvider: "v8",
  testSequencer: './tests/sequencer.cjs'
};
