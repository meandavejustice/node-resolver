var fs = require('fs');
var exec = require('child_process').exec;
var chokidar = require('chokidar');
var isCoreModule = require('is-core-module');
var findModules = require('find-modules');
var stripComments = require('strip-comments');

var installedPackages = {};
var installPre = 'npm install ';

module.exports = watch;

function installer(packageName, cb) {
  exec(installPre + packageName, function (err, stdout, stderr) {
    if (err) cb(err);
    cb(null, stdout, stderr);
  });
}

function removeQuotes (str) {
  str = str.replace(/\'/g, '');
  return str.replace(/\"/g, '');
}

function checkBuffer(data) {
  var lines = stripComments(data.toString()).split('\n');
  lines.forEach(matcher);
}

function matcher (line) {
  var group = line.match(/require\(([^\)]+)\)/g);

  if (group && !~group[0].indexOf('./')) {
    var packageName = removeQuotes(line.match(/\(([^()]+)\)/)[1]);

    if (!installedPackages[packageName] && !isCoreModule(packageName)) {
        console.log('installing ', packageName + ' ...');

      installer(packageName, function(err) {
        if (err) console.error(err);
        console.log('installed ', packageName);
        installedPackages[packageName] = true;
      });
    }
  }
}

function setInstalledModules(dir) {
  findModules(dir, function(err, modules) {
    modules.forEach(function(m) {
      var modName = m.substr(dir.length).split('/')[2];
      if (modName.charAt(0) !== '.') installedPackages[modName] = true;
    });
  });
}

function watch(dir) {
  setInstalledModules(dir);

  var watcher = chokidar.watch(dir, {ignored: /[\/\\]\./, persistent: true});

  watcher.on('change', function(path) {
    fs.createReadStream(path).on('data', checkBuffer);
  });
}
