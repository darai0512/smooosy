import React from 'react'
import QueryDialog from 'components/cards/QueryDialog'

const StartRequestPage = props => {
  const { history, match: { params: { key } } } = props
  return (
    <div>
      <QueryDialog
        open
        noSimilarSelect
        serviceKey={key}
        onClose={() => history.push(`/services/${key}`)}
      />
    </div>
  )
}

export default StartRequestPage
