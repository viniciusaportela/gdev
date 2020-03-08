let fs = require('fs');
let join = require('path').join;

class Cache {
  static set(file, category, value) {
    this.createCache();
    let cache;

    if (!fs.existsSync(join(__dirname, `../cache/${file}.json`))) {
      cache = {}
    } else {
      cache = require(join(__dirname, `../cache/${file}.json`));
    }

    cache[category] = value
    fs.writeFileSync(join(__dirname, `../cache/${file}.json`), JSON.stringify(cache));
  }

  static get() {

  }

  static clean() {
    
  }

  static createCache() {
    if (!fs.existsSync(join(__dirname, '../cache')))
      fs.mkdirSync(join(__dirname, '../cache'))
  }
}

module.exports = Cache;