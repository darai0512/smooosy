const mime = {
  types: {
    all: '*',
    image: {
      all: 'image/*',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
    },
    application: {
      all: 'application/*',
      pdf: 'application/pdf',
    },
  },
}

export default mime