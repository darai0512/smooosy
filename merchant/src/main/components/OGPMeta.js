import React from 'react'
import { Helmet } from 'react-helmet'

import { generateSchemaMeta } from 'lib/json-ld'

export default function OGPMeta({
  title, description, shareImage, width, height, twitterCard, url, rating, structuredDataType,
  author, published, modified, postalCode, addressRegion, addressLocality, category, service, images,
}) {
  const structuredData = generateSchemaMeta({
    structuredDataType,
    title, description, url,
    shareImage, width, height,
    postalCode, addressRegion, addressLocality,
    rating,
    author, published, modified,
    category, service, images,
  })

  return (
    <Helmet>
      <meta name='description' content={description} />
      <meta property='og:type' content='article' />
      <meta property='og:url' content={url} />
      <meta property='og:title' content={title} />
      {shareImage &&
        [
          {key: 'image', property: 'og:image', content: shareImage},
          {key: 'width', property: 'og:image:width', content: width},
          {key: 'height', property: 'og:image:height', content: height},
        ].map(meta => <meta key={meta.key} property={meta.property} content={meta.content} />)
      }
      <meta property='og:description' content={description} />
      <meta property='fb:app_id' content='1871580089750644' />
      <meta property='article:publisher' content='https://www.facebook.com/smooosy/' />
      <meta name='twitter:site' content='@smooosy' />
      <meta name='twitter:url' content={url} />
      <meta name='twitter:card' content={twitterCard} />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      {shareImage && <meta name='twitter:image' content={shareImage} />}
      {structuredData && <script type='application/ld+json'>{JSON.stringify(structuredData)}</script>}
    </Helmet>
  )
}
