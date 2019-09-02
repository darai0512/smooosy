import { ObjectId } from 'mongodb'
import { Schema } from 'mongoose'
import 'mongoose-geojson-schema'


type NestedStringify<T> = {
  [K in keyof T]: T[K] extends Function ? undefined
    : T[K] extends ObjectId ? string
    : T[K] extends (infer R)[] ? NestedStringify<R>[]
    : T[K] extends object ? NestedStringify<T[K]>
    : string
}

interface MongoDefault {
  _id: ObjectId,
  createdAt: Date,
  updatedAt: Date,
}

export type Lean<T> = T & MongoDefault

export namespace models {
  export namespace ProService {
    export type PriceValueType = 'singleBase' | 'base' | 'discount' | 'addon' | 'travelFee'

    export namespace priceValues {
      export interface RequestCondition {
        key: 'distance',
        rangeValue: {
          lowerBound: number,
          upperBound: number,
        },
        type: 'range',
      }
    }

    export interface PriceValue {
      type: PriceValueType,
      answers: ObjectId[],
      requestConditions: priceValues.RequestCondition[],
      value: number,
      _id: ObjectId,
    }

    export interface JobRequirement {
      query: ObjectId,
      answers: ObjectId[],
      _id: ObjectId,
    }
  }

  export namespace Query {
    export namespace options {
      export type Type = 'selector' | 'slider' | 'counter'
    }
  }
  export namespace ProLabel {
    export interface Model {
      text: string,
      service: ObjectId,
    }
  }

  export namespace Blacklist {
    export interface Model {
      target: 'email' | 'name' | 'input' | 'ip' | 'phone',
      type: 'exact' | 'prefix' | 'suffix' | 'partial' | 'regexp',
      enabled: boolean,
      text?: string,
      note?: string,
    }
  }
}

export namespace lib {
  export namespace proService {
    export namespace priceValuesEnabled {
      export interface Service {
        matchMoreEditable: boolean,
        _id: ObjectId | string,
        queries: {
          usedForPro: boolean,
          priceFactorType?: 'base' | 'discount' | 'addon',
        }[],
        singleBasePriceQuery?: any,
        [x: string]: any,
      }
    }
  }

  export namespace matching {
    export namespace instant {
      export interface Media {
        _id: ObjectId,
        ext: string,
        type: string,
        user: ObjectId,
        createdAt: Date,
        updatedAt: Date,
      }

      export interface Query {
        usedForPro?: boolean,
        type: models.Query.options.Type,
        options: {
          usedForPro?: boolean,
          checked?: boolean,
        }[],
        _id: ObjectId,
      }
      export interface AFindMatchingProServicesForQuery {
        service: {
          distance: number,
          _id: ObjectId,
        },
        location: Schema.Types.GeoJSON,
        description: any,
        excludeProfiles?: ObjectId[],
        matchLimit?: number,
        debug?: boolean,
      }

      export interface RFindMatchingProServicesForQuery {
        _id: ObjectId,
        service: ObjectId,
        jobRequirements: models.ProService.JobRequirement[],
        address: string,
        way: number,
        distance: number,
        budget: number,
        priceValues: models.ProService.PriceValue[],
        setupLocation: boolean,
        setupJobRequirements: boolean,
        setupPriceValues: boolean,
        setupBudget: boolean,
        isPromoted: boolean,
        chargesTravelFee: boolean,
        media: Media[],
        description: string,
        user: {
          _id: ObjectId,
          lastname: string,
          imageUpdatedAt?: Date,
          schedule?: {
            dayOff: [boolean, boolean, boolean, boolean, boolean, boolean, boolean],
            startTime: number,
            endTime: number,
          },
          lastAccessedAt: Date,
          isMatchMore?: boolean,
          isInArrears?: boolean,
          hasActiveCard?: boolean,
        },
        profile: {
          _id: ObjectId,
          name: string,
          address?: string,
          description?: string,
          reviewCount?: number,
          averageRating?: number,
          experience?: string,
          media: Media[],
          shortId: string,
        },
      }

      export interface ANearbyPipeline {
        location: Schema.Types.GeoJSON,
        canWorkRemotely: boolean,
        service: {
          _id: ObjectId,
        },
        excludeProfiles?: ObjectId[],
        maxDistance: number,
      }

      export interface ACalculateScore {
        isPromoted: boolean,
        user: {
          hasActiveCard?: boolean,
        },
        priceValues?: models.ProService.PriceValue[],
        jobRequirements?: models.ProService.JobRequirement[],
        way: number,
      }

      export interface AIsMatchMoreProService {
        user: {
          setupBusinessHour: boolean,
        },
        proService: {
          setupLocation: boolean,
          setupJobRequirements: boolean,
        },
      }
    }

  }
}

export namespace routes {
  export namespace services {
    export namespace servicePageV2 {
      export interface Location {
        type: 'Point',
        coordinates: [number, number],
      }

      export interface Service {
        _id: ObjectId,
        key: string,
        name: string,
        imageUpdatedAt: Date,
        description: string,
        providerName: string,
        averagePoint: number,
        matchMoreEnabled: boolean,
        pageMetaDescription: string,
        instantResultAnnotation: string,
        tags: string[],
        category: {
          key: string,
          name: string,
        },
        queries: {
          _id: ObjectId,
          summary: string,
          subType: string,
          usedForPro: boolean,
          type: string,
        }[],
        image: string,
        id: string,
      }

      export interface Location {
        _id: ObjectId,
        loc: ILoc,
        path: string,
        keyPath: string,
        name: string,
      }

      export interface ProService {
        _id: string,
        zipcode: string,
        address: string,
        budget?: number,
        prefecture: string,
        city: string,
        distance: number,
        distanceGroup: number,
        media: {
          id: string,
          url: string,
        }[],
        reviewCount: number,
        priceValues: any[],
        minValue?: number,
        description: string,
        setupPriceValues: boolean,
        score: number,
        existingMeet?: any,
        price?: {
          components: [],
          estimatePriceType: 'minimum',
          total?: number,
        },
        user: {
          lastAccessedAt: Date,
          imageUpdatedAt: Date,
          image: string,
          schedule: {
            dayOff: [boolean, boolean, boolean, boolean, boolean, boolean, boolean],
            startTime: number,
            endTime: number,
          },
          setupBusinessHour: boolean,
          _id: ObjectId,
        },
        profile: {
          _id: ObjectId,
          name: string,
          address: string,
          reviewCount: number,
          averageRating: number,
          description: string,
          score: number,
          media: {
            _id: ObjectId,
            user: ObjectId,
            type: string,
            video?: { youtube: string },
            text?: string,
            ext?: string,
            rotation?: number,
            createdAt: Date,
            updatedAt: Date,
            __v: number,
          }[],
          shortId: string,
        },
        schedules: {
          _id: ObjectId,
          user: ObjectId,
          type: 'phone' | 'consulting' | 'job' | 'block',
          recurrence: 'week' | 'month',
          startTime: Date,
          endTime: Date,
          status?: 'pending' | 'accept',
          createdAt: Date,
          updatedAt: Date,
          id: string,
        }[],
        bestReview?: {
          _id: ObjectId,
          text: string,
          rating?: number,
          service?: ObjectId,
          username?: string,
        },
      }

      export interface Review {
        _id: null,
        count: number,
        avg: number,
      }

      export interface Response {
        service: Service,
        location: Location,
        proServices: ProService[],
        reviewInfo: Review,
      }
    }
  }
}