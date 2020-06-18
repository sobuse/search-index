import si from '../../dist/search-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'QUERY'

test('create a search index', t => {
  t.plan(1)
  si({ name: indexName }).then(db => {
    global[indexName] = db    
    t.pass('ok')
  })
})

test('can add data', t => {
  const data = [
    {
      "_id": 0,
      "make": "Tesla",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 1,
      "make": "BMW",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 2,
      "make": "Tesla",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    },
    {
      "_id": 3,
      "make": "Tesla",
      "manufacturer": "Volvo",
      "brand": "BMW"
    },
    {
      "_id": 4,
      "make": "Volvo",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 5,
      "make": "Volvo",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    },
    {
      "_id": 6,
      "make": "Tesla",
      "manufacturer": "Tesla",
      "brand": "BMW"
    },
    {
      "_id": 7,
      "make": "BMW",
      "manufacturer": "Tesla",
      "brand": "Tesla"
    },
    {
      "_id": 8,
      "make": "Volvo",
      "manufacturer": "BMW",
      "brand": "Tesla"
    },
    {
      "_id": 9,
      "make": "BMW",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    }
  ]

  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

// AND
test('simple AND with 2 clauses', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    AND: [ 'make:volvo', 'manufacturer:bmw' ]
  }).then(res => {
    t.looseEqual(res, [
      { _id: '8', _match: [ 'make:volvo#1.00', 'manufacturer:bmw#1.00' ] }
    ])
  })
})

// BUCKET
test('simple BUCKET', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKET: {
      field: 'make',
      value: 'volvo'
    }
  }).then(res => {
    t.looseEqual(res, {
      field: 'make', value: { gte: 'volvo', lte: 'volvo' }, _id: [ '4', '5', '8' ]
    })
  })
})

// BUCKETFILTER
test('simple BUCKETFILTER', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: [
        {
          field: 'make',
          value: 'volvo'        
        }
      ],
      FILTER: {
        GET: 'brand:tesla'
      }
    }
  }).then(res => {
    t.looseEqual(res, [{
      field: 'make', value: { gte: 'volvo', lte: 'volvo' }, _id: [ '8' ]
    }])
  })
})

// DICTIONARY
test('DICTIONARY', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    DICTIONARY: {
      fields:['make']
    }
  }).then(res => {
    t.looseEqual(res, [ 'bmw', 'tesla', 'volvo' ])
  })
})

// DISTINCT
test('DISTINCT', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    DISTINCT: {
      field: 'make'
    }
  }).then(res => {
    t.looseEqual(res, [
      { field: 'make', value: 'bmw' },
      { field: 'make', value: 'tesla' },
      { field: 'make', value: 'volvo' }
    ])
  })
})

// DISTINCT and BUCKETFILTER
test('DISTINCT and BUCKETFILTER', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: {
        DISTINCT: {
          field: 'make'
        }
      },
      FILTER: {
        GET: {
          field: 'brand',
          value: 'tesla'
        }
      }
    }
  }).then(res => {
    t.looseEqual(res, [
      { field: 'make', value: { gte: 'bmw', lte: 'bmw' }, _id: [ '7' ] },
      { field: 'make', value: { gte: 'tesla', lte: 'tesla' }, _id: [] },
      { field: 'make', value: { gte: 'volvo', lte: 'volvo' }, _id: [ '8' ] }
    ])
  })
})

// DOCUMENTS -> TODO

// GET
test('simple GET', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    GET: 'make:volvo'
  }).then(res => {
    t.looseEqual(res, [
      { _id: '4', _match: [ 'make:volvo#1.00' ] },
      { _id: '5', _match: [ 'make:volvo#1.00' ] },
      { _id: '8', _match: [ 'make:volvo#1.00' ] } 
    ])
  })
})

// NOT -> TODO
test('simple NOT', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    NOT: {
      INCLUDE: 'manufacturer:tesla',
      EXCLUDE: 'brand:volvo'
    }
  }).then(res => {
    t.looseEqual(res, [
      { _id: '6', _match: [ 'manufacturer:tesla#1.00' ] },
      { _id: '7', _match: [ 'manufacturer:tesla#1.00' ] },
    ])
  })
})

test('simple NOT with DOCUMENTS', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    NOT: {
      INCLUDE: 'manufacturer:tesla',
      EXCLUDE: 'brand:volvo'
    }
  }, { DOCUMENTS: true }).then(res => {
    t.looseEqual(res, [
      {
        _id: '6', _match: [ 'manufacturer:tesla#1.00' ], _doc: {
          _id: 6, make: 'Tesla', manufacturer: 'Tesla', brand: 'BMW'
        }
      },
      {
        _id: '7', _match: [ 'manufacturer:tesla#1.00' ], _doc: {
          _id: 7, make: 'BMW', manufacturer: 'Tesla', brand: 'Tesla'
        }
      }
    ])
  })
})


// OR
test('simple OR with 2 clauses', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    OR: [ 'make:volvo', 'brand:tesla' ]
  }).then(res => {
    t.looseEqual(res, [
      { _id: '4', _match: [ 'make:volvo#1.00' ] },
      { _id: '5', _match: [ 'make:volvo#1.00' ] },
      { _id: '7', _match: [ 'brand:tesla#1.00' ] },
      { _id: '8', _match: [ 'make:volvo#1.00', 'brand:tesla#1.00' ] }
    ])
  })
})

// SEARCH
test('simple SEARCH', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    SEARCH: [ 'tesla' ]    // TODO: should be able to search without a normal string?
  }).then(res => {
    t.looseEqual(res, [
      { _id: '2', _match: [ 'make:tesla#1.00', 'manufacturer:tesla#1.00' ], _score: 0.64 },
      { _id: '6', _match: [ 'make:tesla#1.00', 'manufacturer:tesla#1.00' ], _score: 0.64 },
      { _id: '7', _match: [ 'brand:tesla#1.00', 'manufacturer:tesla#1.00' ], _score: 0.64 },
      { _id: '0', _match: [ 'make:tesla#1.00' ], _score: 0.32 },
      { _id: '3', _match: [ 'make:tesla#1.00' ], _score: 0.32 },
      { _id: '5', _match: [ 'manufacturer:tesla#1.00' ], _score: 0.32 },
      { _id: '8', _match: [ 'brand:tesla#1.00' ], _score: 0.32 },
      { _id: '9', _match: [ 'manufacturer:tesla#1.00' ], _score: 0.32 }
    ])
  })
})

