const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const rolloutDates = {
  enableReviewCampaign: ENV === 'production' ? '2019-06-30 23:59:59' : '2019-06-27 17:59:59',
  enableMatchMoreCampaign: ENV === 'production' ? '2019-06-20 00:00:00' : '2019-06-17 00:00:00',
  disableMatchMoreCampaign: '2019-09-16 23:59:59',
  disableLessHiredDiscount: '2019-08-10 00:00:00',
}

export default rolloutDates
