const createID = require('./config');

test('ID exists', () => {
  expect(createID).toBeDefined();
});