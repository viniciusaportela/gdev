const inquirer = require('inquirer');
const fs = require('fs');
const axios = require('axios');
const request = require('request')
const Progress = require('cli-progress')
const Spinner = require('clui').Spinner
let colors = require('colors')
const join = require('path').join
const extract = require('extract-zip')
const Cache = require('./Cache');

class DownloadManager {

  static async downloadGodot(branch) {
    // Check if has cache
    if (fs.existsSync(join(__dirname, '../cache/godot.json'))) {
      // Check if Godot was already downloaded
      let cache = require('../cache/godot.json');

      if (cache[branch] === 'complete') {
        //Already downloaded, and unzipped
        console.log(colors.yellow('> Already in Cache  '));

        return;
      } else if (cache[branch] === 'downloaded') {
        //Need unzip
        await this.unzip(branch);
      } else {
        //Has nothing or incomplete
        await this.startDownload(branch);
        await this.unzip(branch);
      }
    } else {
      await this.startDownload(branch);
      await this.unzip(branch);
    }
  }

  //TODO: Can't ctrl+c during the process (windows)
  static startDownload(branch) {
    return new Promise((resolve, reject) => {
      // Start Download
      Cache.set('godot', branch, 'incomplete')

      let downloadProgress = new Progress.SingleBar({}, Progress.Presets.shades_classic);
      let downloadSpinner = new Spinner('Downloaded 0 bytes', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'])
      let downloaded = 0

      //TODO: Make Function to verify all dirs at once
      if (!fs.existsSync(join(__dirname, '../cache')))
        fs.mkdirSync(join(__dirname, '../cache'))
      if (!fs.existsSync(join(__dirname, '../cache/godot')))
        fs.mkdirSync(join(__dirname, '../cache/godot'))
      if (!fs.existsSync(join(__dirname, `../cache/godot/${branch}`)))
        fs.mkdirSync(join(__dirname, `../cache/godot/${branch}`))

      let output = fs.createWriteStream(join(__dirname, `../cache/godot/${branch}/download.zip`));

      let req = request({
        method: 'GET',
        uri: `https://github.com/godotengine/godot/archive/${branch}.zip`
      })

      req.pipe(output)

      //Setup Listeners
      req.on('response', data => {
        if (data.headers['content-length']) {
          //TODO: Not receiving content-lenght
          downloadProgress.start(data.headers['content-length'], 0)
        } else {
          downloadProgress = undefined

          // See ANSII -> CSI, first move one line upper, then delete line
          //process.stdout.write("\u001b[1F");
          //process.stdout.write("\u001b[2K");

          downloadSpinner.start()
        }
      })

      req.on('data', chunk => {
        downloaded += chunk.length
        if (downloadProgress) {
          downloadProgress.update(downloaded)
        } else {
          downloadSpinner.message(`Downloaded ${downloaded} Bytes`)
        }
      })

      req.on('end', _ => {
        if (downloadProgress) {
          downloadProgress.stop()
        } else {
          downloadSpinner.stop()
        }

        console.log(colors.green('🗸 Downloaded Godot Source '));
        Cache.set('godot', branch, 'downloaded');
        resolve()
      })
    });
  }

  static unzip(branch) {
    return new Promise((resolve, reject) => {
      extract(
        join(__dirname, `../cache/godot/${branch}/download.zip`),
        { dir: join(__dirname, `../cache/godot/${branch}/`) },
        err => {
          if (err) reject();

          console.log('🗸 Godot Unzipped ');
          Cache.set('godot', branch, 'complete');
          resolve();
        });
    })
  }

  static async getGodotBranches() {
    var res = await axios.get('https://api.github.com/repos/godotengine/godot/branches')
    return res.data.map(branch => (branch.name))
  }

}

module.exports = DownloadManager