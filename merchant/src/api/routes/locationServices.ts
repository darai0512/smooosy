export {}
const { Location, LocationService, Profile, ProService, Review, SeoSetting, Service } = require('../models')

const DEBUG = process.env.DEBUG

module.exports = {
  runGenerateLocationServices,
  generateLocationServices,
}

const LOCATION_SERVICE_CONFIG = {
  loop: 5,
  threshold: 100,
  dataTypes: [
    'reviews',
    'proServices',
    'proAnswers',
  ],
  locationLimits: {
    pref: 3,
    area: 20,
    city: 100,
  },
  relatedSevices: {
    loop: 1,
    threshold: 30,
    dataTypes: [
      'reviews',
      'proServices',
    ],
  },
  distance: {
    // args equals prefecture distance
    // max is 300,000 of hokkaido,okinawa
    // min is 40,000 of tokyo,kanagawa,osaka,saitama,saga
    min: (distance) => distance / 8,
    max: (distance) => distance / 4,
  },
  reviews: {
    limit: 12,
    minRating: 3,
    minText: 30,
  },
  proServices: {
    limit: 12,
    // minText: 70,
  },
  proAnswers: {
    limit: 12,
  },
}

/**
 * @return array of Location sorted by geoNear
 * {
 *   prefLocations: [], // same prefecture locations
 *   nearLocations: [], // other prefecture locations
 * }
 */
async function getNearLocations(profile) {
  const project = {
    id: '$_id',
    parentKey: '$parentKey',
    parentName: '$parentName',
    key: '$key',
    name: '$name',
    path: '$path',
    keyPath: '$keyPath',
  }

  // 地域半径内
  const samePref = await Location.aggregate([
    {
      $match: {
        isPublished: true,
        parentKey: 'japan',
        name: profile.prefecture,
        $or: [{group: {$exists: false}}, {group: {$size: 0}}],
      },
    },
    {
      $project: {
        ...project,
        distance: '$distance',
      },
    },
  ])

  // 基本的に都道府県がヒットしないことはないはずだが、エラー回避のため入れておく
  if (samePref.length === 0) {
    console.error(`ERROR: prefecture not found for profile ${profile._id}`)
    return {
      prefLocations: [],
      otherLocations: [],
    }
  }
  const prefDistance = samePref[0].distance

  let profileDistance = 0
  let distanceCondition = {}
  if (profile.distance) {
    profileDistance = Math.min(profile.distance, LOCATION_SERVICE_CONFIG.distance.max(prefDistance))
    distanceCondition = {
      $or: [
        {diffLocation: {$gt: 0}},
        {diffProfileLocation: {$gt: 0}},
      ],
    }
  } else {
    profileDistance = LOCATION_SERVICE_CONFIG.distance.min(prefDistance)
    // 島を横断する可能性があるので、エリア拡大は同一都道府県に留める
    distanceCondition = {
      $or: [
        {diffLocation: {$gt: 0}},
        {$and: [
          {diffProfileLocation: {$gt: 0}},
          {parentName: profile.prefecture},
        ]},
      ],
    }
  }

  const [ otherPref, area, city ] = await Promise.all([
    // pref
    Location.aggregate([
      {
        $geoNear: {
          spherical: true,
          near: profile.loc,
          distanceField: 'way',
          limit: LOCATION_SERVICE_CONFIG.locationLimits.pref,
          query: {
            isPublished: true,
            parentKey: 'japan',
            name: {$ne: profile.prefecture},
            $or: [{group: {$exists: false}}, {group: {$size: 0}}],
          },
        },
      },
      {
        $project: {
          ...project,
          diffLocation: { $subtract: [ '$distance', '$way' ] },
          diffProfileLocation: { $subtract: [ profileDistance, '$way' ] },
        },
      },
      { $match: distanceCondition },
      { $project: project },
    ]),
    // area
    Location.aggregate([
      {
        $geoNear: {
          spherical: true,
          near: profile.loc,
          distanceField: 'way',
          limit: LOCATION_SERVICE_CONFIG.locationLimits.area,
          query: {
            isPublished: true,
            parentKey: {$ne: 'japan'},
            $and: [{group: {$exists: true}}, {group: {$not: {$size: 0}}}],
          },
        },
      },
      {
        $project: {
          ...project,
          diffLocation: { $subtract: [ '$distance', '$way' ] },
          diffProfileLocation: { $subtract: [ profileDistance, '$way' ] },
        },
      },
      { $match: distanceCondition },
      { $project: project },
    ]),
    // city
    Location.aggregate([
      {
        $geoNear: {
          spherical: true,
          near: profile.loc,
          distanceField: 'way',
          limit: LOCATION_SERVICE_CONFIG.locationLimits.city,
          query: {
            isPublished: true,
            parentKey: {$ne: 'japan'},
            $or: [{group: {$exists: false}}, {group: {$size: 0}}],
          },
        },
      },
      {
        $project: {
          ...project,
          diffLocation: { $subtract: [ '$distance', '$way' ] },
          diffProfileLocation: { $subtract: [ profileDistance, '$way' ] },
        },
      },
      { $match: distanceCondition },
      { $project: project },
    ]),
  ])

  area.forEach(a => a.isGroup = true)

  return {
    // same as profile prefecture
    prefLocations: [
      ...samePref,
      ...area.filter(l => l.parentName === profile.prefecture),
      ...city.filter(l => l.parentName === profile.prefecture),
    ],
    // others
    otherLocations: [
      ...otherPref,
      ...area.filter(l => l.parentName !== profile.prefecture),
      ...city.filter(l => l.parentName !== profile.prefecture),
    ],
  }
}

async function runGenerateLocationServices(category) {
  const [ services, seoSettings ] = await Promise.all([
    Service.find({category}).lean(),
    SeoSetting.find({category}).lean(),
  ])
  const relatedServicesMap = {}
  for (const seoSetting of seoSettings) {
    for (const relatedService of seoSetting.relatedServices) {
      if (!relatedServicesMap[relatedService]) {
        relatedServicesMap[relatedService] = []
      }
      relatedServicesMap[relatedService].push(seoSetting.service)
    }
  }

  const profiles = await getProfiles(services)
  const locationServices = generateLocationServices(profiles, relatedServicesMap)
  await updateLocationServices(locationServices, services)
}

/**
 * @param services Array of services
 * @return [
 *   {
 *     // values from model
 *     name, services, address, prefecture, loc, distance, description, score, averageRating, reviewCount,
 *     // values with service
 *     reviews: [
 *       {
 *         service: Object ID,
 *         profile: Object ID,
 *         rating: int,
 *         text: string,
 *       }
 *     ],
 *     proServices: [
 *       {
 *         service: Object ID,
 *         profile: Object ID,
 *         description: string,
 *       }
 *     ],
 *     proAnswers: [
 *       {
 *         service: Object ID,
 *         profile: Object ID,
 *         text: string,
 *       }
 *     ],
 *     // locations
 *     nearLocations: {
 *       prefLocations: [],
 *       nearLocations: [],
 *     }
 *   }
 * ]
 */
async function getProfiles(services) {
  let profiles = await Profile.find({
    services: {$in: services},
    hideProfile: {$ne: true},
    suspend: {$exists: false},
    deactivate: {$ne: true},
    description: {$exists: true, $ne: ''},
  })
  .select('name services address prefecture loc distance description score averageRating reviewCount')
  // .populate('reviews')
  .lean()
  profiles = profiles.sort((a, b) => b.score - a.score)

  // console.time('extract profile')
  let i = 0
  for (const profile of profiles) {
    if (DEBUG && i % 100 === 0) {
      console.error(`[debug] extract profile: ${i}`)
    }
    i++

    const reviews = await Review.find({
      profile,
      rating: {$gt: LOCATION_SERVICE_CONFIG.reviews.minRating},
    })
    .select('service rating text profile')
    .lean()

    profile.reviews = reviews
      .filter(r => r.text && r.text.length > LOCATION_SERVICE_CONFIG.reviews.minText)
      .sort((r1, r2) => r2.text.length - r1.text.length)

    const proServices = await ProService.find({
      profile,
      disabled: {$ne: true},
    })
    .select('service profile description')
    .lean()

    // NOTE: 初回リリースでは関連性を最大にするため、共通プロフィールは使わない
    // if (profile.description) {
    //   profile.proServices = proServices
    // } else {
    //   profile.proServices = proServices.filter(ps => ps.description)
    // }
    profile.proServices = proServices.filter(ps => ps.description)

    // const proAnswers = await ProAnswer.find({
    //   profile,
    // }).populate('service')
    // TODO: fix!!!!!!!!!!!
    //       to make easy to get service from ProAnswer
    const proAnswers = await Service.aggregate([
      {
        $match: {
          _id: { $in: profile.services },
        },
      },
      {
        $project: {
          _id: 1,
          key: 1,
          name: 1,
          proQuestions: 1,
        },
      },
      {
        $project: {
          '_id': false,
          'proQuestion': '$proQuestions',
          'service': '$_id',
        },
      },
      {
        $unwind: '$proQuestion',
      },
      {
        $lookup: {
          from: 'proquestions',
          localField: 'proQuestion',
          foreignField: '_id',
          as: 'proQuestion',
        },
      },
      {
        $unwind: '$proQuestion',
      },
      {
        $lookup: {
          from: 'proanswers',
          localField: 'proQuestion.proAnswers',
          foreignField: '_id',
          as: 'proAnswers',
        },
      },
      {
        $unwind: '$proAnswers',
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$proAnswers',
              '$$ROOT',
            ],
          },
        },
      },
      {
        $match: {
          profile: profile._id,
        },
      },
      {
        $project: {
          _id: true,
          text: true,
          service: true,
          profile: true,
        },
      },
    ])

    profile.proAnswers = proAnswers

    profile.nearLocations = await getNearLocations(profile)

    if (DEBUG) {
      const psLen = proServices.filter(ps => ps.description).length
      const pLen = proServices.filter(ps => !ps.description).length
      console.error(`[debug] profile=${profile._id}, reviews=${profile.reviews.length}, proServices=${psLen}, proAnswers=${profile.proAnswers.length}, commonDescriptions=${pLen}, locations=${profile.nearLocations.prefLocations.length}, nearLocations=${profile.nearLocations.otherLocations.length}`)
      console.error(`[debug] ${profile.address} [${profile.nearLocations.prefLocations.map(v => v.path).join('|')}] [${profile.nearLocations.otherLocations.map(v => v.path).join('|')}]`)
    }
  }
  // console.timeEnd('extract profile')
  return profiles
}

/**
 * @param profiles return value of getProfiles
 * @param relatedServicesMap key: service._id, value: Array of relatedServices
 * @return [
 *   {
 *     service: Object ID,
 *     key: string,
 *     name: string,
 *     parentKey: string,
 *     parentName: string,
 *     path: string,
 *     keyPath: string,
 *     isGroup: boolean,
 *     profiles: Profile Object Array,
 *     reviews: Review Object Array,
 *     proServices: ProService Object Array,
 *     proAnswers: ProAnswer Object Array,
 *   }
 * ]
 */
function generateLocationServices(profiles, relatedServicesMap) {
  const locationServices = {}

  const newLocationService = (location, service) => {
    const key = `${service}_${location.path}`
    if (!locationServices[key]) {
      locationServices[key] = {
        service,
        key: location.key,
        name: location.name,
        parentKey: location.parentKey,
        parentName: location.parentName,
        path: location.path,
        keyPath: location.keyPath,
        isGroup: location.isGroup,
        profiles: [],
        reviews: [],
        proServices: [],
        proAnswers: [],
        relatedReviews: [],
        relatedProServices: [],
      }
    }
    return locationServices[key]
  }

  const decideLocationService = (profile, service, locations, type, object, isRelated = false) => {
    const relatedType = `related${type.charAt(0).toUpperCase()}${type.slice(1)}`

    if (!service) {
      console.error(`skip service is null: ${type} ${isRelated} ${object._id}`)
      return
    }
    if (DEBUG) console.error(`[debug] choose ${type} ${isRelated} ${service}`)

    const lss = locations.map(l => newLocationService(l, service))

    // 2. decide location
    for (const ls of lss) {
      // skip if already assigned to the location
      if (!ls.path) {
        if (DEBUG) console.error(`[debug] location.path is ${ls.path} in ${ls.key}`)
        continue
      }
      if (ls.profiles.includes(profile._id.toString())) {
        if (DEBUG) console.error(`[debug] already registered to ${service} of ${ls.path}`)
        continue
      }

      const totalTypeProfileLen = ls[type].length + (isRelated ? ls[relatedType].length : 0)
      if (totalTypeProfileLen >= LOCATION_SERVICE_CONFIG[type].limit) {
        if (DEBUG) console.error(`[debug] already limit to ${service} of ${ls.path}`)
        continue
      }

      if (DEBUG) console.error(`[debug] decide location of ${type} ${isRelated} to ${service} of ${ls.path}`)
      // 3. set
      ls[isRelated ? relatedType : type].push(object)
      ls.profiles.push(profile._id.toString())
      return
    }
  }

  // same pref
  let config: any = LOCATION_SERVICE_CONFIG
  for (let i = 0; i < config.loop; i++) {
    if (DEBUG) console.error(`loop ${i}`)
    for (const type of config.dataTypes) {
      for (let j = 0; j < config.threshold; j++) {
        // if (DEBUG) console.error(`thread ${i}`)
        for (const profile of profiles) {
          if (j >= profile[type].length) continue
          const object = profile[type][j]
          const locations = profile.nearLocations.prefLocations
          decideLocationService(profile, object.service, locations, type, object)
        }
      }
    }
  }

  // other prefs
  for (let i = 0; i < config.loop; i++) {
    for (const type of config.dataTypes) {
      for (let j = 0; j < config.threshold; j++) {
        for (const profile of profiles) {
          if (j >= profile[type].length) continue
          const object = profile[type][j]
          const locations = profile.nearLocations.otherLocations
          decideLocationService(profile, object.service, locations, type, object)
        }
      }
    }
  }

  // related services
  config = LOCATION_SERVICE_CONFIG.relatedSevices
  for (let i = 0; i < config.loop; i++) {
    for (const type of config.dataTypes) {
      for (let j = 0; j < config.threshold; j++) {
        for (const profile of profiles) {
          if (j >= profile[type].length) continue

          const object = profile[type][j]
          const service = object.service
          if (!relatedServicesMap[service]) continue
          const locations = profile.nearLocations.prefLocations
          for (const relatedService of relatedServicesMap[service]) {
            decideLocationService(profile, relatedService, locations, type, object, true)
          }
        }
      }
    }
  }

  return Object.values(locationServices)
}

async function updateLocationServices(locationServices, services) {
  try {
    const bulk = LocationService.collection.initializeOrderedBulkOp()
    for (const value of locationServices) {
      if (!services.map(s => s._id.toString()).includes(value.service.toString())) {
        continue
      }
      const findData = {
        service: value.service,
        key: value.key,
        name: value.name,
        parentKey: value.parentKey,
        parentName: value.parentName,
        path: value.path,
        keyPath: value.keyPath,
        isGroup: !!value.isGroup,
      }
      const updateData = {
        ...findData,
        reviews: value.reviews.map(v => v._id),
        proServices: value.proServices.map(v => v._id),
        proAnswers: value.proAnswers.map(v => v._id),
        relatedReviews: value.relatedReviews.map(v => v._id),
        relatedProServices: value.relatedProServices.map(v => v._id),
      }
      bulk.find(findData).upsert().updateOne({$set: updateData})
    }

    await new Promise((resolve) => {
      bulk.execute((err, result) => {
        resolve(result)
      })
    })
  } catch (e) {
    console.log(e)
  }
}