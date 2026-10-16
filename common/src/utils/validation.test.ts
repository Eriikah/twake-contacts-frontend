import { isValidEmail } from './validation'

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('a@example.com')).toBe(true)
  })

  it('ignores surrounding whitespace', () => {
    expect(isValidEmail(' a@example.com ')).toBe(true)
  })

  it('rejects whitespace inside the email', () => {
    expect(isValidEmail('a b@example.com')).toBe(false)
  })

  it('rejects an email without domain', () => {
    expect(isValidEmail('a@example')).toBe(false)
  })
})
