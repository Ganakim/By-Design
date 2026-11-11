import {test} from 'node:test'
import assert from 'node:assert/strict'
import match from '../lib/match.js'

const table = {'/':1, '/about':2}

test('known path', ()=>{
  assert.equal(match(table, '/'), '/')
  assert.equal(match(table, '/about'), '/about')
})

test('unknown path', ()=>{
  assert.equal(match(table, '/nowhere'), null)
  assert.equal(match(table, '/about/more'), null)
})

test('trailing slash', ()=>{
  assert.equal(match(table, '/about/'), '/about')
  assert.equal(match(table, '/about//'), '/about')
})

test('names from Object.prototype are not routes', ()=>{
  assert.equal(match(table, '/constructor'), null)
  assert.equal(match(table, 'constructor'), null)
})
