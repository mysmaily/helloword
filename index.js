'use strict'
//var heapdump = require('heapdump')
require('dotenv').config({silent: true})
const PORT = process.env.PORT || 6969
const log = require('./Log')
const server = require('./Server')
server.listen(PORT, () => {
  log.info(`http://0.0.0.0:${PORT}`)
})
// setInterval(function () {
//   heapdump.writeSnapshot('snapshot/' + Date.now() + '.heapsnapshot');
// }, 6000 * 15)