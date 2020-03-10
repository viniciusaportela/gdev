const inquirer = require('inquirer');
const fs = require('fs');
const axios = require('axios');
const request = require('request');
const Progress = require('cli-progress');
const Spinner = require('clui').Spinner;
const colors = require('colors');
const join = require('path').join;
const extract = require('extract-zip');
const Cache = require('./Cache');
const { createDirs } = require('./utils');

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
        await this.unzipGodot(branch);
      } else {
        //Has nothing or incomplete
        await this.startDownloadGodot(branch);
        await this.unzipGodot(branch);
      }
    } else {
      await this.startDownloadGodot(branch);
      await this.unzipGodot(branch);
    }
  }

  //TODO: Can't ctrl+c during the process (windows)
  static startDownloadGodot(branch) {
    return new Promise(async (resolve, reject) => {
      // Start Download
      Cache.set('godot', branch, 'incomplete');

      let downloadProgress = new Progress.SingleBar({}, Progress.Presets.shades_classic);
      let downloadSpinner = new Spinner('Downloaded 0 bytes', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
      let downloaded = 0;

      createDirs(join(__dirname, `../cache/godot/${branch}`));

      await this.download(
        `https://github.com/godotengine/godot/archive/${branch}.zip`,
        join(__dirname, `../cache/godot/${branch}/download.zip`),
        {
          on_start: data => {
            if (data.headers['content-length']) {
              //TODO: Not receiving content-lenght
              downloadProgress.start(data.headers['content-length'], 0)
            } else {
              downloadProgress = undefined
              downloadSpinner.start()
            }
          },
          on_data: chunk => {
            downloaded += chunk.length
            if (downloadProgress) {
              downloadProgress.update(downloaded)
            } else {
              downloadSpinner.message(`Downloaded ${downloaded} Bytes`)
            }
          },
          on_finish: _ => {
            if (downloadProgress) {
              downloadProgress.stop()
            } else {
              downloadSpinner.stop()
            }

            console.log(colors.green('✔️ Downloaded Godot Source '));
            Cache.set('godot', branch, 'downloaded');
            resolve();
          },
        }
      );
    });
  }

  static unzipGodot(branch) {
    const unzipSpinner = new Spinner('Unzipping Godot Source', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    unzipSpinner.start();

    return new Promise((resolve, reject) => {
      extract(
        join(__dirname, `../cache/godot/${branch}/download.zip`),
        { dir: join(__dirname, `../cache/godot/${branch}/`) },
        err => {
          if (err) reject();

          unzipSpinner.stop();
          console.log(colors.green('✔️ Godot Unzipped '));
          Cache.set('godot', branch, 'complete');
          resolve();
        });
    })
  }

  static async downloadGodotCpp() {
    //Check for cache
    let status = Cache.get('godotcpp', 'status');

    if (status === 'complete') {
      console.log(colors.yellow('> Godot CPP already in Cache'));
      return;
    } else if (status === 'downloaded') {
      await this.unzipGodotCpp();
      return;
    }

    Cache.set('godotcpp', 'status', 'incomplete');

    createDirs(join(__dirname, '../cache/godotcpp/master'));

    const godotCppSpinner = new Spinner('Downloading GodotCPP', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    let godotCppProgress = new Progress.SingleBar({}, Progress.Presets.shades_classic);
    let downloaded = 0;

    //TODO: Repeats, create function -> downloadWithProgress
    //Download GodotCPP Source
    await (async () => {
      return new Promise((resolve, reject) => {
        this.download(
          'https://github.com/GodotNativeTools/godot-cpp/archive/master.zip',
          join(__dirname, '../cache/godotcpp/master/download.zip'),
          {
            on_start: data => {
              if (data.headers['content-length']) {
                //TODO: Not receiving content-lenght
                godotCppSpinner.start(data.headers['content-length'], 0)
              } else {
                godotCppProgress = undefined
                godotCppSpinner.start()
              }
            },
            on_data: chunk => {
              downloaded += chunk.length
              if (godotCppProgress) {
                godotCppProgress.update(downloaded)
              } else {
                godotCppSpinner.message(`Downloaded ${downloaded} Bytes`)
              }
            },
            on_finish: async _ => {
              if (godotCppProgress) {
                godotCppProgress.stop()
              } else {
                godotCppSpinner.stop()
              }

              console.log(colors.green('✔️ Downloaded Godot CPP '));
              Cache.set('godotcpp', 'status', 'downloaded');
              await this.unzipGodotCpp();
              resolve();
            },
          }
        )
      });
    })();
  }

  //TODO: Create just unzip(params ...)
  static unzipGodotCpp() {
    const unzipSpinner = new Spinner('Unzipping Godot Cpp', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    unzipSpinner.start();

    return new Promise((resolve, reject) => {
      extract(
        join(__dirname, `../cache/godotcpp/master/download.zip`),
        { dir: join(__dirname, `../cache/godotcpp/master/`) },
        err => {
          if (err) reject();

          unzipSpinner.stop();
          console.log(colors.green('✔️ Godot CPP Unzipped '));
          Cache.set('godotcpp', 'status', 'complete');
          resolve();
        });
    })
  }

  static async downloadGodotHeaders() {
    //Check for cache
    let status = Cache.get('godotheaders', 'status');

    if (status === 'complete') {
      console.log(colors.yellow('> Godot Headers already in Cache'));
      return;
    } else if (status === 'downloaded') {
      await this.unzipGodotHeaders();
      return;
    }

    Cache.set('godotheaders', 'status', 'incomplete');

    createDirs(join(__dirname, '../cache/godotheaders/master'));

    const godotCppSpinner = new Spinner('Downloading Godot Headers', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    let godotCppProgress = new Progress.SingleBar({}, Progress.Presets.shades_classic);
    let downloaded = 0;

    await (async () => {
      godotCppProgress = new Progress.SingleBar({}, Progress.Presets.shades_classic);

      return new Promise((resolve, reject) => {
        this.download(
          'https://github.com/GodotNativeTools/godot_headers/archive/master.zip',
          join(__dirname, '../cache/godotheaders/master/download.zip'),
          {
            on_start: data => {
              if (data.headers['content-length']) {
                //TODO: Not receiving content-lenght
                godotCppSpinner.start(data.headers['content-length'], 0)
              } else {
                godotCppProgress = undefined
                godotCppSpinner.start()
              }
            },
            on_data: chunk => {
              downloaded += chunk.length
              if (godotCppProgress) {
                godotCppProgress.update(downloaded)
              } else {
                godotCppSpinner.message(`Downloaded ${downloaded} Bytes`)
              }
            },
            on_finish: async _ => {
              if (godotCppProgress) {
                godotCppProgress.stop()
              } else {
                godotCppSpinner.stop()
              }

              console.log(colors.green('✔️ Downloaded Godot Headers '));
              Cache.set('godotheaders', 'status', 'downloaded');
              await this.unzipGodotHeaders();
              resolve();
            },
          }
        )
      });
    })();
  }

  static unzipGodotHeaders() {
    const unzipSpinner = new Spinner('Unzipping Godot Headers', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    unzipSpinner.start();

    return new Promise((resolve, reject) => {
      extract(
        join(__dirname, `../cache/godotheaders/master/download.zip`),
        { dir: join(__dirname, `../cache/godotheaders/master/`) },
        err => {
          if (err) reject();

          unzipSpinner.stop();
          console.log(colors.green('✔️ Godot Headers Unzipped '));
          Cache.set('godotheaders', 'status', 'complete');
          resolve();
        });
    })
  }

  static async getGodotBranches() {
    var res = await axios.get('https://api.github.com/repos/godotengine/godot/branches')
    return res.data.map(branch => (branch.name))
  }

  static async download(url, output_path, { on_start, on_data, on_finish }) {
    return new Promise((resolve, reject) => {
      let output = fs.createWriteStream(output_path);

      let req = request({
        method: 'GET',
        uri: url
      })

      req.pipe(output)

      //Setup Listeners
      req.on('response', data => on_start(data))

      req.on('data', chunk => on_data(chunk))

      req.on('end', _ => {
        on_finish();
        resolve();
      })
    });
  }

}

module.exports = DownloadManager