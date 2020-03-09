/**
 * Create all needed directories to reach a determined path
 * @param {String} dir_path 
 */
function createDirs(dir_path) {
  const fs = require('fs');
  const patternOthers = '((?:(?:.*?\\\/)|(?:(?<=\\\/).*)))';
  const patternWindows = '((?:(?:.*?\\\\)|(?:(?<=\\\\).*)))';
  const reg = new RegExp((require('os').platform() === 'win32') ? patternWindows : patternOthers, 'gm');

  let res;
  let cur_path = '';
  while (res = reg.exec(dir_path)){
    cur_path += res[1];
    //Check for cur_path
    if (!fs.existsSync(cur_path)) {
      fs.mkdirSync(cur_path)
    }
  }
}

module.exports = {
  createDirs
}