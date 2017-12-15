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
const TB_TRN = 'transaction'

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'example',
})

connection.connect((err) => {
  if (err) throw err
  console.log('Connected to mysql')
})

let queries = []


queries.push(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`)
queries.push(`USE ${DB_NAME}`)
const TB_ACT = 'activity'
queries.push(`DROP TABLE IF EXISTS ${TB_ACT}`)
queries.push(
  `CREATE TABLE IF NOT EXISTS ${TB_ACT}(
                     id INT NOT NULL AUTO_INCREMENT,
        activity_status INT,
     collaboration_type INT,
             conditions INT,
       default_aid_type VARCHAR(255),
   default_finance_type INT,
      default_flow_type INT,
       description_text VARCHAR(10000),
       description_type INT,
                iati_id VARCHAR(255) NOT NULL,
                  other JSON,
          reporting_org VARCHAR(255) NOT NULL,
            sector_code INT,
       sector_narrative VARCHAR(255),
      sector_percentage VARCHAR(256),
       sector_vocbulary INT,
                  title VARCHAR(255) NOT NULL,
  PRIMARY KEY(id)
  )`)

// Budget Table
const TB_BUDGET = 'budget'
queries.push(`DROP TABLE IF EXISTS ${TB_BUDGET}`)
queries.push(
  `CREATE TABLE IF NOT EXISTS ${TB_BUDGET}(
            id INT NOT NULL AUTO_INCREMENT,
       iati_id VARCHAR(255) NOT NULL,
         value FLOAT,
    value_date DATE,
  period_start DATE,
    period_end DATE,
  PRIMARY KEY(id)
  )`)

// Participating Organisation Table
const TB_PARTICIPATING_ORG = 'participating_org'
queries.push(`DROP TABLE IF EXISTS ${TB_PARTICIPATING_ORG}`)
queries.push(
  `CREATE TABLE IF NOT EXISTS ${TB_PARTICIPATING_ORG}(
         id INT NOT NULL AUTO_INCREMENT,
    iati_id VARCHAR(255) NOT NULL,
        ref VARCHAR(255),
       type VARCHAR(255),
       role VARCHAR(255),
  narrative VARCHAR(255),
  PRIMARY KEY(id)
  )`)

// Planned Disbursement Table
const TB_PLANNED_DISBURSEMENT = 'planned_disbursement'
queries.push(`DROP TABLE IF EXISTS ${TB_PLANNED_DISBURSEMENT}`)
queries.push(
  `CREATE TABLE IF NOT EXISTS ${TB_PLANNED_DISBURSEMENT}(
            id INT NOT NULL AUTO_INCREMENT,
       iati_id VARCHAR(255) NOT NULL,
         value FLOAT,
    value_date DATE,
  period_start DATE,
    period_end DATE,
  PRIMARY KEY(id)
  )`)

// Policy Marker Table
const TB_POLICY_MARKER = 'policy_marker'
queries.push(`DROP TABLE IF EXISTS ${TB_POLICY_MARKER}`)
queries.push(
  `CREATE TABLE IF NOT EXISTS ${TB_POLICY_MARKER}(
            id INT NOT NULL AUTO_INCREMENT,
       iati_id VARCHAR(255) NOT NULL,
          code INT,
    vocabulary INT,
  significance INT,
     narrative VARCHAR(255),
  PRIMARY KEY(id)
  )`)

// Recipient Country Table
const TB_RECIPIENT_COUNTRY = 'recipient_country'
queries.push(`DROP TABLE IF EXISTS ${TB_RECIPIENT_COUNTRY}`)
queries.push(
  `CREATE TABLE IF NOT EXISTS ${TB_RECIPIENT_COUNTRY}(
          id INT NOT NULL AUTO_INCREMENT,
     iati_id VARCHAR(255) NOT NULL,
        code VARCHAR(2),
  percentage INT,
   narrative VARCHAR(255),
  PRIMARY KEY(id)
  )`)

// Transactions Table
queries.push(`DROP TABLE IF EXISTS ${TB_TRN}`)
queries.push(
  `CREATE TABLE IF NOT EXISTS ${TB_TRN}(
                id INT NOT NULL AUTO_INCREMENT,
           iati_id VARCHAR(255) NOT NULL,
             value FLOAT,
        value_date DATE,
  transaction_date DATE,
  transaction_code INT,
  PRIMARY KEY(id)
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
