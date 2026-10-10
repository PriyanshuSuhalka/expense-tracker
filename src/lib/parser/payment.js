const PREFIX = String.raw`(?:(?:via|by|using|through|with|in|on|from)\s+)?(?:(?:my|the|a)\s+)?`
const RULES = [
  ['UPI', new RegExp(String.raw`\b${PREFIX}(?:upi|gpay|google\s*pay|phone\s*pe|phonepe|paytm|bhim)\b`, 'i')],
  ['Cash', new RegExp(String.raw`\b${PREFIX}cash\b`, 'i')],
  ['Card', new RegExp(String.raw`\b${PREFIX}(?:(?:credit|debit)\s+cards?|cards?)\b`, 'i')],
  ['Other', new RegExp(String.raw`\b${PREFIX}(?:net\s*banking|bank\s+transfer|neft|imps|cheque)\b`, 'i')],
]

export function extractPayment(text) {
  for (const [method, re] of RULES) {
    const m = re.exec(text)
    if (m) return { paymentMethod: method, rest: text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length) }
  }
  return { paymentMethod: null, rest: text }
}
