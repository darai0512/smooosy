import fileType from 'lib/file-type'

export function dataURLtoBlob(dataURL, mime) {
  mime = mime || 'image/jpeg'
  const bin = atob(dataURL.split(',')[1])
  const uint8array = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    uint8array[i] = bin.charCodeAt(i)
  }

  return new Blob([uint8array], {type: mime})
}

export function getFileType(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => {
      const type = fileType(new Uint8Array(reader.result))
      if (!type) resolve({})

      resolve(type)
    }
    reader.onerror = () => resolve({})
    reader.readAsArrayBuffer(file)
  })
}
