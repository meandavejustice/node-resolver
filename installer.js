var exec = require('child_process').exec;
var installPre = 'npm install ';

module.exports = function(packageName, cb) {
  exec(installPre + packageName, function (err, stdout, stderr) {
    if (err) cb(err);
    cb(null, stdout, stderr);
  });
}
