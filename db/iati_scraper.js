'use strict'

const fs = require('fs')
const request = require('request')
const xmlNodes = require('xml-nodes')
const xml2js = require('xml2js')
const mysql = require('mysql')

// Constants
const DB_NAME = 'openaid'
const TB_ACT = 'activity'
const TB_TRN = 'transaction'

const reportingOrg = 'SE-0'
const offset = 50000
const limit = 3
const stream = 'True'

const url = 'http://datastore.iatistandard.org/api/1/access/activity.xml' +
    '?stream=' + stream +
    '&reporting-org=' + reportingOrg +
    '&offset=' + offset +
    '&limit=' + limit

// const cachePath = 'iati.xml'
// const cachePath = 'unknown.xml'
const cachePath = './data/activity.xml'
// const cachePath = './data/act900.xml'

const dbconnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'example'
})

/**
 * TODO: Check if streaming actually works
 * (04/12/17) Simon Lee
 */
var dataStream
if (fs.existsSync(cachePath)) {
  console.log('Cache file found')
  dataStream = fs.createReadStream(cachePath, { encoding: 'utf8' })
} else {
  console.log('No cache file found; Pulling from iati')
  dataStream = request(url)
}

let counter = 0
dataStream
    .on('open', () => {
        // // Open db connection
      dbconnection.connect((error) => {
        if (error) throw error
            // console.log('Connected to mysql');
      })

        // // Change to correct database
      dbconnection.query(`USE ${DB_NAME}`, function (error, res) {
        if (error) throw error
            // console.log("Changed database");
      })
    })
    .pipe(xmlNodes('iati-activity')) // Get each iati-activity node
    .on('data', (data) => {
      const xml = data.toString('utf8')
      xml2js.parseString(xml, async (error, result) => {
        if (error) throw error
        const activity = result['iati-activity']
        counter += 1
        await mangleActivity(activity)
      })
    })
    .on('end', () => {
      dbconnection.end((error) => {
        if (error) throw error
            // console.log('Connection Closed')
      })
    })

/**
 * TODO: Process all the fields
 * (04/12/17) Simon Lee
 */
const mangleActivity = (activity) => {
    // console.log(JSON.stringify(activity, null, 2))
    // console.log(activity)
  const identifier = activity['iati-identifier'][0]
  const reportingOrg = activity['reporting-org'][0]['$']['ref']
    // console.log('========' + identifier + '========')

  let message = ''

  let recipientCountry
  let recipientCountryContribution
  try {
    recipientCountry = activity['recipient-country'][0]['$']['code']
  } catch (error) {
    message += 'recipientCountry, '
    recipientCountry = null
  }
  try {
    recipientCountryContribution = activity['recipient-country'][0]['$']['percentage']
  } catch (error) {
    message += 'recipient_country_contribution, '
    recipientCountryContribution = null
  }

  const transactions = []
  let transactionSum = 0
  try {
    transactionSum = activity['transaction'].reduce((sum, transaction) => {
            // console.log(JSON.stringify(transaction, null, 2))
            // console.log(transaction['transaction-type'][0]['$']['code'])

      // let code = transaction['transaction-type'][0]['$']['code']
      let value = parseFloat(transaction['value'][0]['_'])
      let date = (transaction['value'][0]['$']['value-date'])

      transactions.push([identifier, value, date])

      sum += parseFloat(transaction['value'][0]['_'])

      return sum
    }, 0)
  } catch (error) {
/**
 * TODO: Do not push N/A row.
 * There is no need to push an empty row, just push nothing
 * (04/12/17) Simon Lee
 */
    message += 'transaction'
    transactionSum = null
    transactions.push([identifier, null, null])
  }

  const activities = [[identifier, reportingOrg, recipientCountry, recipientCountryContribution, transactionSum]]

/**
 * TODO: Create array of mysql queries to loop over
 * (04/12/17) Simon Lee
 */
  let sql = ''
  let values = ''
  // Insert transactions into db
  sql = `INSERT INTO ${TB_TRN} (iati_id, value, date) VALUES ?`
  values = transactions

  dbconnection.query(sql, [values], function (error, res) {
    if (error) throw error
  })

    // Insert activities into db
  sql = `INSERT INTO ${TB_ACT} (iati_id, reportingOrg, recipientCountry,
               recipient_country_contribution, transactionSum) VALUES ?`
  values = activities

  dbconnection.query(sql, [values], function (error, res) {
    if (error) {
      console.log(values)
      throw error
    }
  })

    // transactions
    // activities
  if (message.length !== 0) message = 'N/A on: ' + message
  console.log('Processed: ', counter, ' | ', identifier, message)
}
