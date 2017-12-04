/**
 * TODO: Index columns
 * Index columns iati_id for faster access. 
 * Currently down manually in MySQL Workbench
 * (04/12/17) Simon Lee
 */

/**
 * TODO: Add non-root users
 * (04/12/17) Simon Lee
 */
const mysql = require('mysql')

// Constants
const DB_NAME = 'openaid'
const TB_ACT = 'activity'
const TB_TRN = 'transaction'

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'example'
})

connection.connect((err) => {
  if (err) throw err
  console.log('Connected to mysql')
})

let queries = []

/**
 * TODO: Update schema
 * Need to make some columns NOT NULL, i.e. iati_id and reporting_org.
 * (04/12/17) Simon Lee
 */

queries.push(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`)
queries.push(`USE ${DB_NAME}`)
queries.push(`DROP TABLE IF EXISTS ${TB_ACT}`)
queries.push(`CREATE TABLE IF NOT EXISTS ${TB_ACT}(
            id INT NOT NULL AUTO_INCREMENT,
            PRIMARY KEY(id),
            iati_id VARCHAR(255),
            reporting_org VARCHAR(255),
            recipient_country CHAR(2),
            recipient_country_contribution INT,
            transactions_sum FLOAT
            )`)

queries.push(`DROP TABLE IF EXISTS ${TB_TRN}`)
queries.push(`CREATE TABLE IF NOT EXISTS ${TB_TRN}(
            id INT NOT NULL AUTO_INCREMENT,
            PRIMARY KEY(id),
            iati_id VARCHAR(255),
            value FLOAT,
            date DATE
            )`)

queries.forEach((sql) => {
  connection.query(sql, function (err, res) {
    if (err) throw err
    console.log('Executed: ' + sql)
  })
})

connection.end((error) => {
  if (error) throw error
  console.log('Connection Closed')
})
