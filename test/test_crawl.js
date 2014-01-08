
var expect = require('expect.js')
  , token = process.env.TOKEN
  , base = process.env.PID
  , db = process.env.MONGO || 'mongodb://localhost/fftest'
  , fsl = require('../lib/fslayer')

if (!token) throw new Error('No token given')
if (!base) throw new Error('No base person')

fsl(db, token, function (err, crawler) {
  crawler.crawl(base, 2, function (pid, data, num) {
    console.log(pid, num)
    console.log(JSON.stringify(data, null, 2))
  }, function (n, d) {
    console.log(n, d)
    process.exit(0)
  })
})



