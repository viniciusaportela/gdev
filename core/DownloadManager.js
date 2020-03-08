

let inquirer = require('inquirer');
let fs = require('fs');
let axios = require('axios');
let request = require('request')
let Progress = require('cli-progress')
let Spinner = require('clui').Spinner
let join = require('path').join

class DownloadManager {

  static async downloadGodot() {
    let answer = await inquirer.prompt([{
      name: "branch",
      type: "list",
      message: "Which Version of Godot you would like to use?",
      choices: await this.getGodotBranches()
    }])

    // Check has cache
    if (fs.existsSync('./cache/godot.json')) {
      // Check if Godot was already downloaded
    }
    
    // Start Download
    let downloadProgress = new Progress.SingleBar({}, Progress.Presets.shades_classic);
    downloadProgress.start(1, 0)
    let downloadSpinner = new Spinner('Downloaded 0 bytes', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'])
    let downloaded = 0
    
    //TODO: Make Function to verify all dirs at once
    if (!fs.existsSync(join(__dirname, '../cache')))
      fs.mkdirSync(join(__dirname, '../cache'))
    if (!fs.existsSync(join(__dirname, '../cache/godot')))
      fs.mkdirSync(join(__dirname, '../cache/godot'))
    if (!fs.existsSync(join(__dirname, `../cache/godot/${answer.branch}`)))
      fs.mkdirSync(join(__dirname, `../cache/godot/${answer.branch}`))
    
    //TODO: Can't ctrl+c during the process (windows)
    let output = fs.createWriteStream(join(__dirname, `../cache/godot/${answer.branch}/download.zip`));
    let req = request({
      method: 'GET',
      uri: `https://github.com/godotengine/godot/archive/${answer.branch}.zip`
    })
    
    req.pipe(output)

    //Setup Listeners
    req.on('response', data => {
      if(data.headers['content-length']){
        //TODO: Not receiving content-lenght
        downloadProgress.setTotal(data.headers['content-length'])
      }else{
        downloadProgress.stop()
        downloadProgress = undefined

        // See ANSII -> CSI, first move one line upper, then delete line
        process.stdout.write("\u001b[1F");
        process.stdout.write("\u001b[2K");

        downloadSpinner.start()
      }
    })

    req.on('data', chunk => {
      downloaded += chunk.length
      if (downloadProgress){
        downloadProgress.update(downloaded)
      }else{
        downloadSpinner.message(`Downloaded ${downloaded} Bytes`)
      }
    })

    req.on('end', _ => {
      if(downloadProgress){
        downloadProgress.stop()
      } else {
        downloadSpinner.stop()
      }
    })
  }

  static async getGodotBranches() {
    var res = await axios.get('https://api.github.com/repos/godotengine/godot/branches')
    return res.data.map(branch => (branch.name))
  }

}

module.exports = DownloadManager