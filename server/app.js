const express = require('express')
const mysql = require('mysql')
const json2csv = require('json2csv')
const pivot = require('quick-pivot')
const json2pivotjson = require('json-to-pivot-json')

// Constants
const DB_NAME = 'openaid'
const TB_ACT = 'activity'
const TB_TRN = 'transaction'

// Constants
const PORT = 3000
const HOST = '0.0.0.0'

const connection = mysql.createConnection({
  host: 'db',
  user: 'root',
  password: 'example',
  database: DB_NAME
})

connection.connect((err) => {
  if (err) throw err
  console.log('Connected to mysql')
})

// App
const app = express()
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api/countries.csv', (req, res) => {
  const query = `SELECT recipient_country AS code, YEAR(transaction.date) AS year, SUM(transaction.value) AS transaction
                  FROM activity
                  INNER JOIN transaction ON activity.iati_id = transaction.iati_id
                  GROUP BY code, year`
  connection.query(query, function (err, sql) {
    if (err) throw err
    const pivot = json2pivotjson(sql, {
                                  row:'code',
                                  column:'year',
                                  value:'transaction'
                                })
    
    // Add years in pivot table
    let columns = Object.keys(pivot[0]).filter(x => (x.length ===4 && parseInt(x) ))
    columns.unshift('code')
    console.log(columns)
    const csv = json2csv({data: pivot, 
                          fields: columns
                         })
    
    

    res.send(csv)
  })
})

app.listen(PORT, HOST)

console.log(`Listening on http://${HOST}:${PORT}`)
