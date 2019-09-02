module.exports = {
  error: {
    client: {
      error: {
        type: 'client_error',
        message: 'client data error',
      },
    },
    card: {
      error: {
        type: 'card_error',
        message: 'card data error',
      },
    },
    server: {
      error: {
        type: 'server_error',
        message: 'payjp down',
      },
    },
  },

  customer: (user) => {
    return {
      id: 'payjpId1',
      cards: {
        count: 1,
        data: [
          {
            brand: 'Visa',
            customer: 'payjpId1',
            id: 'cardId1',
            object: 'card',
          },
        ],
      },
      default_card: 'cardId1',
      metadata: { userId: user.id },
    }
  },
}
