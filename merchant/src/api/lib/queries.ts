import { ObjectId } from 'mongodb'
import { Query, QueryHistory, ProService } from '../models'
import { QueryHistoryModel } from '../models/queryHistory'

export const INCLUDE_ADMIN_FIELDS = '+usePriceToPoint +priceToPoints'

// Creates a query, a query history to track edits to this query, and
// returns the outside-facing pointer to the query
export async function createQueryWithHistory(queryData: any): Promise<any> {
  delete queryData.id
  delete queryData._id

  const query = await Query.create(queryData)

  const activeQuery = await Query.create({
    ...queryData,
    historicalQuery: query._id,
  })

  await QueryHistory.create({
    activeQuery: activeQuery._id,
    queries: [query._id],
  })

  return activeQuery
}

// Updates a query by copying the new data into the given query ID
// and also adding it to the historical list of query edits for this query's
// history
export async function updateQuery(queryId: ObjectId, queryData: any): Promise<any> {
  delete queryData.id
  delete queryData._id
  delete queryData.historicalQuery

  const activeQuery = await Query.findById(queryId).select(INCLUDE_ADMIN_FIELDS)

  if (activeQuery === null) return null

  const queryHistory = await QueryHistory.findOne({
    activeQuery: activeQuery._id,
  })

  // step 1: create query that permanently contains the new query's data
  const newQuery = await Query.create(queryData)

  // step 2: update pro services
  const oldOptions = activeQuery.options.map(o => o._id.toString())
  const newOptions = newQuery.options.map(o => o._id.toString())
  const added = newOptions.filter(o => !oldOptions.includes(o))
  if (added.length) {
    // add jobRequirements when added options
    // jobRequirements.$ means matched elements of jobRequirements
    await ProService.updateMany({
      'jobRequirements.query': activeQuery._id,
    }, {
      $addToSet: {
        'jobRequirements.$.answers': {$each: added},
      },
    })
  }

  // step 3: add it to query history
  queryHistory.queries.push(newQuery._id)

  // step 4: make it the active query
  activeQuery.set({
    ...queryData,
    historicalQuery: newQuery._id,
  })

  await queryHistory.save()
  await activeQuery.save()

  return activeQuery
}

export async function getQueryHistory(queryId: ObjectId): Promise<QueryHistoryModel> {
  return await QueryHistory
    .findOne({ activeQuery: queryId })
    .populate({
      path: 'activeQuery',
      select: INCLUDE_ADMIN_FIELDS,
    })
    .populate({
      path: 'queries',
      select: INCLUDE_ADMIN_FIELDS,
    })
}