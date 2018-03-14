// Import MD5 Hash
var md5 = require('md5');
process.argv = ['-key', 'test_key'];

const {
  id,
  md5_key,
  createID,
  system
} = require('./config');

test('ID Tests', () => {
  expect(createID).toBeDefined();
  expect(id).toBeDefined();
  expect(id).not.toBeNull();
  expect(id).not.toBe(createID());
});

test('Key Tests', () => {
  expect(system.key).toEqual('test_key');
  expect(md5_key).toEqual(md5(id + '-' + system.key));
});

test('System Config Tests', () => {
  expect(system.port).toBeDefined();
  expect(system.max_clients).toBeDefined();
  expect(system.key).toBeDefined();
  expect(system.directory).toBeDefined();
  expect(system.log).toBeDefined();
  expect(system.ssl).toBeDefined();
  expect(system.cert).toBeDefined();
  expect(system.key_ssl).toBeDefined();
});