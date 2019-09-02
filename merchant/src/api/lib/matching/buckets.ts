export {}
// Specifies which matching algorithm bucket a given pro belongs to
// possible values:
// 'distance' - pro chosen during distance ranking step
// 'overallMeetRateAndDistance' - pro chosen during meet rate + distance ranking step
// 'randomFilter' - pro randomly chosen just based on being active - for requests with no location set
// 'matchedByUser' - pro was manually chosen by user
// 'matchedByAdmin' - pro was manually matched by admin
// 'newPro' - pro was matched based on being a new pro
// 'signedUpWithRequest' - pro signed up from this request lead
const matchingBuckets = {
  CLASSIC_DISTANCE: 'classicDistance',
  CLASSIC_MEET_RATE_DISTANCE: 'classicMeetRateDistance',
  CLASSIC_RANDOM_FILTER: 'classicRandomFilter',
  MATCHED_BY_USER: 'matchedByUser',
  MATCHED_BY_ADMIN: 'matchedByAdmin',
  NEW_PRO: 'newPro',
  SIGNED_UP_WITH_REQUEST: 'signedUpWithRequest',
  HEAVY_USER: 'heavyUser',
  LIGHT_USER: 'lightUser',
}

module.exports = {
  matchingBuckets,
}
