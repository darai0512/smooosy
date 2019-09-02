export {}
import { ObjectId } from 'mongodb'
const { oidIncludes } = require('./mongoid')
const { arrayIntersection } = require('./util')

import { lib as Interfaces } from '../interfaces'

export const filterPriceValuesWithJobRequirements = (
  priceValues: {answers: (ObjectId | string)[], [x: string]: any}[],
  jobRequirements: {answers: (ObjectId | string)[], [x: string]: any, query: (ObjectId | string)}[],
  queries: {_id: (ObjectId | string), usedForPro: boolean, priceFactorType?: string, options: {_id: (ObjectId | string), usedForPro: boolean}[]}[],
) => {
  if (!jobRequirements.length) return priceValues
  const pvQueries = queries.filter(q => q.priceFactorType)

  return priceValues.filter(pv => {
    for (const a of pv.answers) {
      const query = pvQueries.find(q => {
        const usedOptions = q.options.filter(o => o.usedForPro).map(o => o._id)
        return oidIncludes(usedOptions, a)
      })
      if (!query) return false

      const jobRequirement = jobRequirements.find(j => j.query.toString() === query._id.toString())
      if (!jobRequirement) continue
      if (!oidIncludes(jobRequirement.answers, a)) return false
    }

    return true
  })
}

export const priceValuesEnabled = (
  service: Interfaces.proService.priceValuesEnabled.Service,
  runtimeConfigs: {name: string, services: (ObjectId | string)[], [x: string]: any}[]
) => {
  if (service.matchMoreEditable) return true

  const baseQueryExists = service.singleBasePriceQuery || service.queries.some(q => q.priceFactorType === 'base')
  if (!baseQueryExists) return false

  if (runtimeConfigs.some(rc => rc.name === 'price_values_enabled' && oidIncludes(rc.services, service))) return true
  return false
}

export const filterValidJobRequirements = (
  jobRequirements: {query: (ObjectId | string), answers: (ObjectId | string)[], [x: string]: any}[],
  queries: {_id: (ObjectId | string), usedForPro: boolean, options: {_id: (ObjectId | string), usedForPro: boolean}[]}[]
) => {
  return jobRequirements.filter(jr => {
    const q = queries.find(q => q._id.toString() === jr.query.toString() && q.usedForPro)
    if (!q) return false
    const availableOptions = q.options.filter(o => o.usedForPro).map(o => o._id.toString())
    return arrayIntersection(jr.answers.map(a => a.toString()), availableOptions).length === jr.answers.length
  })
}
