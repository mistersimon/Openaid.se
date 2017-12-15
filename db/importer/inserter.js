const util = require('util')
exports.insertActivity = async (dbconnection, activity) => {
  // console.log(JSON.stringify(activity, null, 2))
  // console.log(activity)

  // Table names as keys and value as SET
  let inserts = {}
  const createInsert = (table, array, parser) => {
    if (array) {
      inserts[table] = array.map(parser)
    }
  }

  inserts['activity'] = [{
       'activity_status': activity['activity-status'],
    'collaboration_type': activity['collaboration-type'],
            'conditions': activity['conditions'],
      'default_aid_type': activity['default-aid-type'],
  'default_finance_type': activity['default-finance-type'],
     'default_flow_type': activity['default-flow-type'],
      'description_text': activity['description']['narrative'],
      'description_type': activity['description']['type'],
               'iati_id': activity['iati-identifier'],
                //  'other': activity['other'],
         'reporting_org': activity['reporting-org'],
           'sector_code': activity['sector']['code'],
      'sector_narrative': activity['sector']['narrative'],
      'sector_vocbulary': activity['sector']['vocbulary'],
     'sector_percentage': activity['sector']['percentage'],
                 'title': activity['title']
  }]

  createInsert('budget', activity['budget'], (item) => {
    return {
      'iati_id': activity['iati-identifier'],
      'value': item['value'],
      'value_date': item['value-date'],
      'period_start': item['period-start'],
      'period_end': item['period-end']
    }
  })

  createInsert('participating_org', activity['participating-org'], (item) => {
    return {
      'iati_id': activity['iati-identifier'],
      'ref': item['ref'],
      'type': item['type'],
      'role': item['role'],
      
      'narrative': item['narrative']
    }
  })

  createInsert('planned_disbursement', activity['planned-disbursement'], (item) => {
    return {
      'iati_id': activity['iati-identifier'],
      'value': item['value'],
      'value_date': item['value-date'],
      'period_start': item['period-start'],
      'period_end': item['period-end']
    }
  })

  createInsert('policy_marker', activity['policy-marker'], (item) => {
    return {
      'iati_id': activity['iati-identifier'],
      'code': item['code'],
      'vocabulary': item['vocabulary'],
      'significance': item['significance'],
      'narrative': item['narrative']
    }
  })

  createInsert('recipient_country', activity['recipient-country'], (item) => {
    return {
      'iati_id': activity['iati-identifier'],
      'code': item['code'],
      'percentage': item['percentage'],
      'narrative': item['narrative']
    }
  })

  createInsert('transaction', activity['transaction'], (item) => {
    return {
      'iati_id': activity['iati-identifier'],
      'value': item['value'],
      'value_date': item['value-date'],
      'transaction_date': item['transaction-date'],
      'transaction_code': item['transaction-code']
    }
  })

  const queryPromises = []
  const fn = util.promisify(dbconnection.query).bind(dbconnection)

  // Lets try building one long query

  let query = ''
  let values = []
  try {
    // Insert all values into various tables
    for (const [table, records] of Object.entries(inserts)) {
      for (const record of records) {
        query = query + `INSERT INTO ${table} SET ?;`
        values.push(record)
      }
    }
    return fn(query, values)
  } catch (error) {
    throw error
  }
}
