var assert = require('assert');
var rwebreports = require('..');
var fs = require('fs');

var filename = 'test.pdf';

var config = 'DSN RRBYW18\n'
  + 'REPORT_NAME Customers\n'
  + 'WHERE_CLAUSE OPTION PDF | FILENAME ' + filename;

rwebreports(config, function (err) {
  assert(!err, 'Unexpected error');
  assert(fs.existsSync(filename), 'Expected file to exist');
  fs.unlinkSync(filename);
});
