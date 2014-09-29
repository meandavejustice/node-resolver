var fs = require('fs');
var chokidar = require('chokidar');
var isCoreModule = require('is-core-module');
var findModules = require('find-modules');
var installer = require('./installer');

function watch(dir) {
  var installedPackages = {};
  findModules(dir, function(err, modules) {
    modules.forEach(function(m) {
      var modName = m.substr(dir.length).split('/')[2];
      if (modName.charAt(0) !== '.') installedPackages[modName] = true;
    });
  });

  var watcher = chokidar.watch('.', {ignored: /[\/\\]\./, persistent: true});

  watcher.on('change', function(path) {
    fs.createReadStream(path)
    .on('data', function(data) {
      var lines = data.toString().split('\n');
      // TODO: check for comments
      lines.forEach(matcher);
    });
  });

  function removeQuotes (str) {
    str = str.replace(/\'/g, '');
    return str.replace(/\"/g, '');
  }

  function matcher (line) {
    var group = line.match(/require\(([^\)]+)\)/g);

    if (group && !~group[0].indexOf('./')) {
      var packageName = removeQuotes(line.match(/\(([^()]+)\)/)[1]);

      if (!installedPackages[packageName] && !isCoreModule(packageName)) {
        installer(packageName, function(err) {
          if (err) console.error(err);
          console.log('installed ', packageName);
          installedPackages[packageName] = true;
          console.log('installed packages include: ', Object.keys(installedPackages));
        });
      }
    }
  }
}

// watch(process.cwd());