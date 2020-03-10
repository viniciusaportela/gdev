const fs = require('fs');
const join = require('path').join;

/**
 * @class Cache
 * 
 * Manage Cache Requests and Saves
 */
class Cache {

  /**
   * Set a value in Cache
   * @param {String} file - Pathname to file, to save
   * @param {*} key - Key inside file
   * @param {*} value - value to given key
   */
  static set(file, key, value) {
    this.createCache();
    let cache;

    if (!fs.existsSync(join(__dirname, `../cache/${file}.json`))) {
      cache = {}
    } else {
      cache = require(join(__dirname, `../cache/${file}.json`));
    }

    cache[key] = value
    fs.writeFileSync(join(__dirname, `../cache/${file}.json`), JSON.stringify(cache));
  }

  static get(file, key) {
    if (fs.existsSync(join(__dirname, `../cache/${file}.json`))) {
      return require(join(__dirname, `../cache/${file}.json`))[key]
    } else {
      return undefined;
    }
  }

  /**
   * Create a Dir inside Cache
   * @param {String} dir_relative_path 
   */
  static createDir(dir_relative_path) {
    let { createDirs } = require('./utils');
    createDirs(join(__dirname, '../cache/' + dir_relative_path));
  }

  static clean() {

  }

  /**
   * Create cache folder if doesn't exists yet
   */
  static createCache() {
    if (!fs.existsSync(join(__dirname, '../cache')))
      fs.mkdirSync(join(__dirname, '../cache'))
  }
}

module.exports = Cache;