const FILLER = 'i|we|just|spent|spend|paid|pay|gave|give|given|bought|buy|purchased|purchase|had|have|ordered|order|got|get|added|add|expense|expenses|worth|of|about|around|approx|approximately|it|was|is|a|an|the|my|for|on|to|at|in|from|with|via|by|into|and|also|then|only|total|rupees|rupee|rs|bucks|inr'
const LEAD = new RegExp(String.raw`^[\s,.:;\-₹]*(?:(?:${FILLER})\b[\s,.:;\-₹]*)+`, 'i')
const TRAIL = new RegExp(String.raw`[\s,.:;\-₹]*(?:\b(?:for|on|to|at|in|from|with|via|by|and|of|the|a|an|my|only|total|please|rupees|rs)\b[\s,.:;\-₹]*)+$`, 'i')

/** Strip leading verbs/prepositions and trailing connectors, keeping merchant and internal words. */
export function cleanDescription(text) {
  let s = text.replace(/\s+/g, ' ').trim()
  s = s.replace(LEAD, '').replace(TRAIL, '')
  return s.replace(/^[\s,.:;\-₹]+|[\s,.:;\-₹]+$/g, '').replace(/\s+/g, ' ').trim()
}
