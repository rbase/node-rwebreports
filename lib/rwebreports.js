var Promise = require('bluebird');
var temp = require('temp');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var child_process = Promise.promisifyAll(require('child_process'));

function getVariablesConfig(variables) {
  return Object.keys(variables).map(function (name) {
    var value = variables[name];
    if (value == null) {
      return 'VARIABLE ' + name + '|TEXT|NULL';
    } else if (typeof value === 'number' && value % 1 == 0) {
      return 'VARIABLE ' + name + '|INTEGER|' + value;
    } else {
      var escaped = ('' + value).replace(/'/g, '\'\'');
      return 'VARIABLE ' + name + '|TEXT|\'' + escaped + '\'';
    }
  }).join('\n');
}

function getLicensesConfig(licenses) {
  return licenses.map(function (license) {
    return 'ADD_LICENSE ' + license;
  }).join('\n');
}

function getConfig(commandPath, dsn, variables, licenses) {
  return 'DSN ' + dsn + '\n'
    + 'HOME_DIR ' + path.dirname(commandPath) + '\n'
    + 'RUN ' + path.basename(commandPath) + '\n'
    + 'IGNORE_REPORT_NAME\n'
    + 'SHOW_WARNING_MESSAGES\n'
    + 'SHOW_ERROR_MESSAGES\n'
    + getVariablesConfig(variables) + '\n'
    + getLicensesConfig(licenses) + '\n';
}

function runConfigFile(configPath) {
  var rwebreportsPath = process.env.RWEBREPORTS_PATH;

  if (!rwebreportsPath) {
    return Promise.reject('RWEBREPORTS_PATH not set');
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

function runConfig(config) {
  var configPath = temp.path({
    prefix: 'rwebreports-',
    suffix: '.txt'
  });

  return fs.writeFileAsync(configPath, config, 'utf8')
    .then(function () {
      return runConfigFile(configPath);
    }).catch(function (err) {
      err.config = config;
      throw err;
    }).finally(function () {
      return fs.unlinkAsync(configPath);
    });
}

function runCommandFile(options) {
  var commandPath = options.commandPath;
  var dsn = options.dsn;
  var variables = options.variables || {};
  var licenses = options.licenses || [];

  if (!commandPath || !dsn) {
    throw new Error('Must specify commandPath and dsn');
  }

  return runConfig(getConfig(commandPath, dsn, variables, licenses));
}

function runCommand(options) {
  var command = options.command;
  var dsn = options.dsn;
  var variables = options.variables || {};
  var licenses = options.licenses || [];

  if (!command || !dsn) {
    throw new Error('Must specify command and dsn');
  }

  var commandPath = temp.path({
    prefix: 'rwebreports-cmd-',
    suffix: '.txt'
  });

  return fs.writeFileAsync(commandPath, command, 'utf8')
    .then(function () {
      return runCommandFile({
        commandPath: commandPath,
        dsn: dsn,
        variables: variables,
        licenses: licenses
      });
    }).catch(function (err) {
      err.command = command;
      throw err;
    }).finally(function () {
      return fs.unlinkAsync(commandPath);
    });
}

module.exports = {
  runConfigFile: runConfigFile,
  runConfig: runConfig,
  runCommandFile: runCommandFile,
  runCommand: runCommand
}
