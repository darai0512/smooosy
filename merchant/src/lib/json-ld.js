export const companyData = {
  '@type': 'Organization',
  name: 'SMOOOSY',
  url: 'https://smooosy.com',
  logo: 'https://smooosy.com/images/logo.png',
  sameAs: [
    'https://www.facebook.com/smooosy',
    'https://twitter.com/smooosy',
    'http://instagram.com/smooosy',
  ],
}

const localBusinessCategories = {
  'administrative-scrivener': 'LegalService', // 行政書士
  'car-maintenance': 'AutomotiveBusiness', // 車検・修理工場
  'cleaning': 'DryCleaningOrLaundry', // クリーニング
  'labor-consultant': 'LegalService', // 社会保険労務士
  'patent-attorney': 'LegalService', // 弁理士
  'tax-accountant': 'LegalService', // 税理士
}

const localBusinessServices = {
  'automobile-body-repair-and-paint': 'AutoBodyShop', // 車の板金塗装
}

export function generateSchemaMeta({
    structuredDataType,
    title, description, url,
    shareImage, width, height,
    postalCode, addressRegion, addressLocality,
    rating,
    author, published, modified,
    category, service, images,
  }) {
  if (!structuredDataType) {
    return null
  }

  const structuredData = {
    '@context': 'http://schema.org',
    '@type': structuredDataType,
    name: title,
    description,
  }
  if (shareImage) {
    structuredData.image = {
      '@type': 'ImageObject',
      url: shareImage,
      width: width || 1200,
      height: height || 630,
    }
  }
  if (rating) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.avg,
      reviewCount: rating.count,
    }
  }
  if ('LocalBusiness' === structuredDataType) {
    structuredData['@id'] = url
    structuredData.address = {
      '@type': 'PostalAddress',
      'addressCountry': 'JP',
    }
    if (postalCode) structuredData.address.postalCode = postalCode
    if (addressRegion) structuredData.address.addressRegion = addressRegion
    if (addressLocality) structuredData.address.addressLocality = addressLocality
    if (category && category in localBusinessCategories) {
      structuredData['@type'] = localBusinessCategories[category]
    }
    if (service && service in localBusinessServices) {
      structuredData['@type'] = localBusinessServices[service]
    }
    if (images) {
      structuredData.image = images
    }
  }
  if (/Article/.test(structuredDataType)) {
    structuredData.headline = title
    structuredData.publisher = companyData
    structuredData.datePublished = published + '+09:00'
    structuredData.dateModified = modified + '+09:00'
    if (author) {
      structuredData.author = {
        '@type': 'Person',
        name: author,
      }
    }
  }
  if ('WebSite' === structuredDataType) {
    structuredData.url = url
    structuredData.potentialAction = {
      '@type': 'SearchAction',
      target: `${url}?q={search_term}`,
      'query-input': 'required name=search_term',
    }
  }

  return structuredData
}
