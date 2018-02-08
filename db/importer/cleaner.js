/**
 * Clean a Item from xml
 */
const cleanItem = (dirty, clean, key, parser) => {
  let value = dirty[key]
  if (value) {
    value = parser(dirty[key][0])
    clean[key] = value
  }
}

/**
 * Clean a list from xml
 */
const cleanArray = (dirty, clean, key, parser) => {
  const array = dirty[key]
  if (array) {
    clean[key] = array.map(item => parser(item))
  }
}

/**
 * Takes the dirty output from the xml parser and outputs clean json
 * Missing parameters are not returned, i.e. no null values
 * @param {object} activity - Activity object
  // http://iatistandard.org/202/schema/downloads/iati-activities-schema.xsd
 */
exports.cleanActivity = (activity, encoding, done) => {
  // cleaned activity
  let clean
  // Curry clean item and array
  const addIfExists = (key, parser) => cleanItem(activity, clean, key, parser)
  const addIfExistsArray = (key, parser) => cleanArray(activity, clean, key, parser)

  // Lets start off with must non-null values
  clean = {
    'iati-identifier': activity['iati-identifier'][0],
    'reporting-org': activity['reporting-org'][0]['$']['ref'],
    // The english title is not in an object with languague and title
    'title': activity['title'][0]['narrative'].filter(x => typeof x === 'string')[0],
    'activity-status': activity['activity-status'][0]['$']['code']
  }

  addIfExists('collaboration-type', x => parseInt(x['$']['code']))
  addIfExists('default-flow-type', x => parseInt(x['$']['code']))
  addIfExists('default-finance-type', x => parseInt(x['$']['code']))
  addIfExists('default-aid-type', x => x['$']['code'])
  addIfExists('conditions', x => x['$']['attached'])

  addIfExists('sector', x => {
    return {
      'code': parseInt(x['$']['code']),
      'vocbulary': parseInt(x['$']['vocabulary']),
      'percentage': parseInt(x['$']['percentage']),
      'narrative': x['narrative'][0]
    }
  })

  // This snippet is not working. Throws unhandled rejection promise
  // console.log(activity['country-budget-items'])
  // addIfExists('country-budget-items', (item) => {
  //   if (item['budget-item']) {
  //     return {
  //       'vocabulary': item['$']['vocabulary'],
  //       'budget-item': {
  //         'code': item['budget-item'][0]['$']['code'],
  //         'percentage': parseInt(item['budget-item'][0]['$']['percentage']),
  //         'narrative': item['budget-item'][0]['description'][0]['narrative'][0]
  //       }
  //     }
  //   }
  // })

  // TODO - Not very proud of this
  addIfExists('crs-add', (item) => {
    let obj = {}
    for (let key of Object.keys(item)) {
      const array = item[key]
      if (array) {
        obj[key] = array.reduce((list, elem) => {
          list.push({
            'code': parseInt(elem['$']['code']),
            'significance': parseInt(elem['$']['significance'])
          })
          return list
        }, new Array())
      }
      return obj
    }
  })

  addIfExistsArray('participating-org', (item) => {
    return {
      'ref': item['$']['ref'],
      'type': item['$']['type'],
      'role': item['$']['role'],
      'narrative': item['narrative'][0]
    }
  })

  addIfExists('description', (item) => {
    return {
      'type': parseInt(item['$']['type']),
      'narrative': item['narrative'].filter(x => typeof x === 'string')[0]
    }
  })

  addIfExistsArray('recipient-country', (item) => {
    return {
      'code': item['$']['code'],
      'percentage': parseInt(item['$']['percentage']),
      'narrative': item['narrative'][0]
    }
  })

  addIfExistsArray('transaction', (item) => {
    return {
      'value': parseFloat(item['value'][0]['_']),
      'value-date': item['value'][0]['$']['value-date'],
      'transaction-date': item['transaction-date'][0]['$']['iso-date'],
      'transaction-code': parseInt(item['transaction-type'][0]['$']['code'])
    }
  })

  addIfExistsArray('policy-marker', (item) => {
    return {
      'code': parseInt(item['$']['code']),
      'vocabulary': parseInt(item['$']['vocabulary']),
      'significance': parseInt(item['$']['significance']),
      'narrative': item['narrative'][0]
    }
  })

  addIfExistsArray('planned-disbursement', (item) => {
    return {
      'period-start': item['period-start'][0]['$']['iso-date'],
      'period-end': item['period-end'][0]['$']['iso-date'],
      'value': parseFloat(item['value'][0]['_']),
      'value-date': item['value'][0]['$']['value-date']
    }
  })

  addIfExistsArray('budget', (item) => {
    return {
      'period-start': item['period-start'][0]['$']['iso-date'],
      'period-end': item['period-end'][0]['$']['iso-date'],
      'value': parseFloat(item['value'][0]['_']),
      'value-date': item['value'][0]['$']['value-date']
    }
  })

  addIfExistsArray('activity-date', (item) => {
    return {
      'date': item['$']['iso-date'],
      'type': item['$']['type']
    }
  })

  // Delete all of the used keys
  // TODO - Delete only the children keys
  const uselessKeys = ['contact-info', '$']
  for (let key of Object.keys(clean).concat(uselessKeys)) {
    delete activity[key]
  }
  clean['other'] = activity

  // Add data back to stream
  done(null, clean)
}
