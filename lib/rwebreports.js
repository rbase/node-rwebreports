var Promise = require('bluebird');
var temp = require('temp');
var fs = Promise.promisifyAll(require('fs'));
var child_process = Promise.promisifyAll(require('child_process'));

function runExe(configPath) {
  var rwebreportsPath = process.env.RWEBREPORTS_PATH;
  if (!rwebreportsPath) {
    return Promise.reject('path to rwebreports not specified');
  }
  return child_process.execFileAsync(rwebreportsPath, [configPath])
    .then(function (stdout, stderr) {
      output = stdout.toString();
      if (!output.match(/^OK/)) {
        var err = new Error('rwebreports error');
        err.output = output;
        throw err;
      }
    });
}

function execute(config, callback) {
  var configPath = temp.path({prefix: 'rwebreports-', 'suffix': '.txt'});
  fs.writeFileAsync(configPath, config, 'utf8')
    .then(function () {
      return runExe(configPath);
    })
    .catch(function (err) {
      err.config = config;
      throw err;
    })
    .nodeify(callback)
    .done();
}

module.exports = execute;
