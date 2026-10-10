import { describe, it, expect } from 'vitest'
import { parseExpense, parseAlternatives } from '../lib/parser/parseExpense.js'
import { DEFAULT_CATEGORIES } from '../lib/defaults.js'

// 2026-10-11 is a Sunday.
const TODAY = '2026-10-11'
const run = (t, today = TODAY) => parseExpense(t, DEFAULT_CATEGORIES, today)
const one = (t, today) => {
  const r = run(t, today)
  expect(r).toHaveLength(1)
  return r[0]
}

describe('required cases', () => {
  const cases = [
    ['spent 250 on groceries at DMart', 250, 'Groceries', TODAY, null, 'groceries at DMart'],
    ['paid 1200 electricity bill via UPI', 1200, 'Bills & Utilities', TODAY, 'UPI', 'electricity bill'],
    ['80 rupees chai yesterday', 80, 'Food & Dining', '2026-10-10', null, 'chai'],
    ['uber 340 card', 340, 'Transport', TODAY, 'Card', 'uber'],
    ['two thousand five hundred for new shoes', 2500, 'Shopping', TODAY, null, 'new shoes'],
    ['1.5k dinner with friends on Saturday', 1500, 'Food & Dining', '2026-10-10', null, 'dinner with friends'],
    ['gave 500 to Rahul', 500, null, TODAY, null, 'Rahul'],
    ['450 under health for medicines', 450, 'Health', TODAY, null, 'medicines'],
    ['bought something', null, null, TODAY, null, 'something'],
  ]
  it.each(cases)('%s', (text, amount, category, date, payment, description) => {
    const e = one(text)
    expect(e.amount).toBe(amount)
    expect(e.category).toBe(category)
    expect(e.date).toBe(date)
    expect(e.paymentMethod).toBe(payment)
    expect(e.description.toLowerCase()).toBe(description.toLowerCase())
  })

  it('50 for chai and 120 for auto -> two expenses', () => {
    const r = run('50 for chai and 120 for auto')
    expect(r.map((e) => e.amount)).toEqual([50, 120])
    expect(r.map((e) => e.category)).toEqual(['Food & Dining', 'Transport'])
    expect(r.map((e) => e.description.toLowerCase())).toEqual(['chai', 'auto'])
    expect(r.every((e) => e.date === TODAY && e.paymentMethod === null)).toBe(true)
  })
})

describe('amounts', () => {
  it.each([
    ['spent 1,250 on lunch', 1250],
    ['1250.50 petrol', 1250.5],
    ['₹300 chai', 300],
    ['rs 45 chai', 45],
    ['chai 20 bucks', 20],
    ['2k rent', 2000],
    ['one lakh rent', 100000],
    ['one hundred and fifty for lunch', 150],
    ['two thousand five hundred and fifty rupees shopping', 2550],
    ['twenty-five chai', 25],
    ['2 kg tomatoes 80', 80],
  ])('%s -> %s', (t, amount) => expect(one(t).amount).toBe(amount))

  it('does not split "hundred and fifty" into two expenses', () => {
    expect(run('one hundred and fifty for lunch')).toHaveLength(1)
  })
  it('flags a lone small number word as low confidence', () => {
    expect(one('bought one coffee').confidence.amount).toBeLessThan(0.8)
  })
})

describe('dates', () => {
  it.each([
    ['100 chai today', '2026-10-11'],
    ['100 chai day before yesterday', '2026-10-09'],
    ['100 chai on Sunday', '2026-10-04'],
    ['100 chai on Monday', '2026-10-05'],
    ['100 chai on the 5th', '2026-10-05'],
    ['100 chai on the 20th', '2026-09-20'],
    ['100 chai 5th October', '2026-10-05'],
    ['100 chai 25 December', '2025-12-25'],
    ['100 chai 3 days ago', '2026-10-08'],
  ])('%s -> %s', (t, date) => expect(one(t).date).toBe(date))

  it('rolls the 31st back past short months', () => {
    expect(one('100 chai on the 31st', '2026-10-11').date).toBe('2026-08-31')
  })
  it('accepts a Date object for today', () => {
    expect(one('100 chai', new Date(2026, 9, 11)).date).toBe('2026-10-11')
  })
})

describe('categories and payment', () => {
  it('handles plurals', () => expect(one('300 medicines').category).toBe('Health'))
  it('ties give null', () => expect(one('400 dinner at dmart').category).toBeNull())
  it('explicit category phrasing wins', () => {
    const e = one('200 uber in shopping category')
    expect(e.category).toBe('Shopping')
    expect(e.confidence.category).toBe(1)
  })
  it('"category X" form', () => expect(one('90 chai category transport').category).toBe('Transport'))
  it('respects custom keywords', () => {
    const cats = DEFAULT_CATEGORIES.map((c) => (c.name === 'Gifts & Donations' ? { ...c, keywords: [...c.keywords, 'rahul'] } : c))
    expect(parseExpense('gave 500 to Rahul', cats, TODAY)[0].category).toBe('Gifts & Donations')
  })
  it.each([
    ['100 chai gpay', 'UPI'],
    ['100 chai by phonepe', 'UPI'],
    ['100 chai paytm', 'UPI'],
    ['100 chai in cash', 'Cash'],
    ['100 shoes credit card', 'Card'],
    ['100 shoes debit card', 'Card'],
  ])('%s -> %s', (t, pm) => expect(one(t).paymentMethod).toBe(pm))
})

describe('misc', () => {
  it('empty input -> no expenses', () => expect(run('   ')).toEqual([]))
  it('folds amount-less pieces into the neighbour', () => {
    const r = run('250 for milk, bread and eggs')
    expect(r).toHaveLength(1)
    expect(r[0].amount).toBe(250)
  })
  it('parseAlternatives prefers one with an amount', () => {
    const r = parseAlternatives(['bought something', 'bought 80 chai'], DEFAULT_CATEGORIES, TODAY)
    expect(r[0].amount).toBe(80)
  })
})
