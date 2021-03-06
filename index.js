
var fs = require('fs');
var basename = require('path').basename;
var moment = require('moment');
var accounting = require('accounting');
var Buffers = require('buffers');
var chokidar = require('chokidar');
var SerialPort = require("serialport").SerialPort;

var now = Date.now();
var devicePath = process.env.DEVICE_PATH || '/dev/tty.usbmodemfa141';
var watcher = chokidar.watch(process.env.HOME + '/.Trash', { persistent: true, ignoreInitial: true });
var serialport = new SerialPort(devicePath, { baudrate: 19200 });

watcher.on('add', function(path, stats) {
  console.log('detected:', path);
  var bufs = new Buffers();
  var filename = basename(path);
  try {
    var data = fs.readFileSync(path);

    bufs.push(new Buffer('filename  : ' + filename + '\n'));
    bufs.push(new Buffer('filesize  : ' + accounting.formatNumber(stats.size) + ' bytes\n'))
    bufs.push(new Buffer('created at: ' + moment(stats.atime).format('YYYY/MM/DD HH:mm:ss') + '\n'));
    bufs.push(new Buffer('================================' + '\n'));
    bufs.push(new Buffer(data.slice(0, 255)));
    bufs.push(new Buffer('\n'));
    bufs.push(new Buffer('================================' + '\n'));
    bufs.push(new Buffer('\n\n'));
  
    console.log(bufs.toString());

    serialport.write(bufs.toBuffer(), function() {
      console.log('wrote: ', path);
      serialport.flush(function() {
        console.log('flushed: ', path);
      });
    });
  } catch (e) {
    console.error('error: ', e);
  }
});

watcher.on('error', function(e) {
  console.error('error :', e);
});

serialport.on('open', function() {
  serialport.on('data', function() {
    console.log('data from board: ', arguments);
  });
});
