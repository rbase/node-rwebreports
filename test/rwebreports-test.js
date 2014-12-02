var assert = require('assert');
var rwebreports = require('..');
var fs = require('fs');
var path = require('path');

var dsn = 'RRBYW18';

var configFilename = path.join(__dirname, 'config.pdf');
var config = 'DSN ' + dsn + '\n'
  + 'REPORT_NAME Customers\n'
  + 'WHERE_CLAUSE OPTION PDF | FILENAME ' + configFilename;

rwebreports.runConfig(config)
  .then(function () {
    assert(fs.existsSync(configFilename), 'Expected file to exist');
  }).catch(function () {
    assert(false, 'Unexpected error');
  }).finally(function () {
    fs.unlinkSync(configFilename);
  }).done()

var commandFilename = path.join(__dirname, 'command.pdf');
var command = 'PRINT Customers OPTION PDF | FILENAME &vFilename';

rwebreports.runCommand({
  command: command,
  dsn: dsn,
  variables: {vFilename: commandFilename}
}).then(function () {
    assert(fs.existsSync(commandFilename), 'Expected file to exist');
  }).catch(function () {
    assert(false, 'Unexpected error');
  }).finally(function () {
    fs.unlinkSync(commandFilename);
  }).done()
