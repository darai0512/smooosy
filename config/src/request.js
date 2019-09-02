// TODO should manage the following values on the field of mongodb's `service` collection

const defaultHiredRate = 1 / 9 // 見積りあたりの成約率
const defaultPointThreshold = 1 // [TEMP] DO NOT FLAG 0.6 // point for pro is high or not

const request = {
  hiredRate: defaultHiredRate,
  pointThreshold: defaultPointThreshold,
}

export default request
