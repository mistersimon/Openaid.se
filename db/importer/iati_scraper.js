'use strict'
const fs = require('fs')
const request = require('request')
const xmlNodes = require('xml-nodes')
const xml2js = require('xml2js')
const mysql = require('mysql')
const util = require('util')
const parseXML = util.promisify(xml2js.parseString)

const {cleanActivity} = require('./cleaner.js')
const {insertActivity} = require('./inserter.js')

// Constants
const DB_NAME = 'openaid'
const TB_ACT = 'activity'
const TB_TRN = 'transaction'

// Stream ignores offset and limit
const reportingOrg = 'SE-0'
const offset = 50000
const limit = 50
const stream = 'False'

const url = 'http://datastore.iatistandard.org/api/1/access/activity.xml' +
    '?reporting-org=' + reportingOrg +
    // '&stream=' + stream +
    '&offset=' + offset +
    '&limit=' + limit

// const cachePath = './db/cache/act900.xml'
// const cachePath = './db/cache/activity.xml'

const dbconnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'example'
})

/**
 * TODO: Streaming doesn't quite work. Event timings are different to readstream
 * (15/12/17) Simon Lee
 */
var dataStream
if (typeof cachePath !== 'undefined' && fs.existsSync(cachePath)) {
  console.log('Cache file found')
  dataStream = fs.createReadStream(cachePath, { encoding: 'utf8' })
} else {
  console.log('No cache file found; Pulling from iati')
  console.log(url)
  dataStream = request(url)
}

const onStart = async () => {
  // Open db connection
  dbconnection.connect((error) => {
    if (error) throw error
    console.log('Connected to mysql');
  })

  // Change to correct database
  dbconnection.query(`USE ${DB_NAME}`, function (error, res) {
    if (error) throw error
    // console.log("Changed database");
  })
}

let counter = 0

// fs and request have different start events. Attach listners for both.
dataStream
    .on('socket', onStart)
    .on('open', onStart)

dataStream
  .pipe(xmlNodes('iati-activity')) // Get each iati-activity node
  .on('data', async (data) => {
    try {
      const xml = data.toString('utf8')
      let json = await parseXML(xml)
      const activity = cleanActivity(json['iati-activity'])
      await insertActivity(dbconnection, activity)
    } catch (error) {
      throw error
    }
    if (++counter % 1 === 0) {
      process.stdout.write('\rProcessed:' + counter)
    }
  })

dataStream
  .on('end', () => {
    dbconnection.end((error) => {
      if (error) throw error
      console.log('Connection Closed')
    })
  })
