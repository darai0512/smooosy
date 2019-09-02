export {}
import { ObjectId } from 'mongodb'

interface Options {
  includeOtherService?: boolean,
  service?: ObjectId | string,
}
interface Review {
  service?: ObjectId | string,
  rating: number,
  text?: string,
}

export const getBestReview = <T extends Review>(reviews: T[], options: Options = {}) => {
  reviews = reviews.slice()
  const { includeOtherService, service } = options
  if (service && !includeOtherService) reviews = reviews.filter(r => r.service && r.service.toString() === service.toString())
  if (!reviews.length) return null
  const bestReview = sortReviews(reviews)
    .slice() // sort is destructive
    .sort((a, b) => {
      if (!service) return 0
      if (includeOtherService
        && (a.service && a.service.toString() !== service.toString())
        && (b.service && b.service.toString() === service.toString())
      ) {
        return -1
      } else if (includeOtherService
        && (a.service && a.service.toString() === service.toString())
        && (b.service && b.service.toString() !== service.toString())
      ) {
        return 0
      }
    })[0]
  return bestReview
}

export const sortReviews = <T extends Review>(reviews: T[]) => {
  if (!reviews.length) return reviews
  return reviews
    .slice() // sort is destructive
    .sort((a, b) => {
      const textA = a.text || ''
      const textB = b.text || ''
      return textB.length - textA.length
    })
    .sort((a, b) => {
      return b.rating - a.rating
    })
}