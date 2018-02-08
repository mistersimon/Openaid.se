'use strict'
const fs = require('fs')
const request = require('request')
const xmlNodes = require('xml-nodes')
const xml2js = require('xml2js')
const mysql = require('mysql2')
const util = require('util')
const parseXML = util.promisify(xml2js.parseString)
const through2 = require('through2')
const async = require('async')

const {cleanActivity} = require('./cleaner.js')
const {createInsert} = require('./inserter.js')

const logFile = fs.createWriteStream('log.txt', { flags: 'a' });

const iatiUrl = (params) => {
  let url = 'http://datastore.iatistandard.org/api/1/access/activity.xml?'

  for (const [option, value] of Object.entries(params)) {
    url += option + '=' + value + '&'
  }

  return url
}

var dbpool = mysql.createPool({
  connectionLimit: 10,
  multipleStatements: true,
  host: 'localhost',
  user: 'root',
  password: 'example',
  database: 'openaid'
})

// const cachePath = './db/cache/act10.xml'
const cachePath = './db/cache/problem.xml'
// const cachePath = './db/cache/activity.xml'

var dataStream
if (typeof cachePath !== 'undefined' && fs.existsSync(cachePath)) {
  console.log('Cache file found')
  dataStream = fs.createReadStream(cachePath, { encoding: 'utf8' })
} else {
  console.log('No cache file found; Pulling from iati')
  const url = iatiUrl({
    'reporting-org': 'SE-0',
    'stream': true
    // 'limit': ,
    // 'offset': 5000
  })
  console.log(url)
  dataStream = request(url)
}

const convertXML2JSON = through2.obj(function (item, encoding, done) {
  parseXML(item)
  .then(json => {
    id =  json['iati-activity']['iati-identifier'][0]
    done(null, json['iati-activity'])
  })
  .catch(error => console.log(error))
})

// Handler that runs on exit, closes db connection
const exitHandler = () => {
  dbpool.end((error) => {
    if (error) throw error
    console.log('DB Connection Terminated')
  })
}

let counter = 0
const activityWorker = function (task, done) {
  const id = task['activity'][0]['iati_id']
  // Lets build a multi statement query 
  let query = ''
  let values = []

  // Loop over each table
  for (const [table, records] of Object.entries(task)) {
    // Loop over each record
    for (const record of records) {
      query = query + `INSERT INTO ${table} SET ?;`
      values.push(record)
    }
  }

  dbpool.getConnection((error, connection) => {
    if (error) throw error
    connection.query(query, values, (err, res) => {
      if (err) {
        logFile.write(id + '\n')
        console.log('error on id:', id)
        // console.log(query, values)
        // throw err
      }
      // activityStream.resume()
      console.log('Finished ', ++counter, ', id:', id)
      connection.release()
      done()
    })
  })
}

// How many workers should run in parrallel?
const concurrency = 1000
let activityQueue = async.queue(activityWorker, concurrency)

// Assign callback when queue is finished
activityQueue.drain = () => exitHandler()

// Pause the stream if queue is full to apply backpressure and avoid hogging memory
activityQueue.saturated = () => dataStream.pause()

// Resume the stream if the there is a short queue
activityQueue.unsaturated = () => dataStream.resume()

// Current IATI Activity
let id = null

// Process datastream
dataStream
  .pipe(xmlNodes('iati-activity')) // Convert xml2js
  .pipe(convertXML2JSON)
  .pipe(through2.obj(cleanActivity))
  .pipe(through2.obj(createInsert))
  .on('data', (data) => {
    activityQueue.push(data)
  })

// Kill db connection on force-quite
process.on('SIGINT', exitHandler)
