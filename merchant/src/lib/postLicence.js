import { zenhan } from 'lib/string'

export default function postLicence(licence) {
  const licenceInfo = licence.licence
  if (!licenceInfo.url) return
  const values = licenceInfo.convert ? eval('(' + licenceInfo.convert + ')')(zenhan(licence.info)) : {value: zenhan(licence.info)}

  const form = document.createElement('form')
  form.setAttribute('action', licenceInfo.url)
  form.setAttribute('method', licenceInfo.method)
  form.setAttribute('target', '_blank')

  const input = document.createElement('input')
  input.setAttribute('name', licenceInfo.field)
  input.setAttribute('value', values.value)
  form.appendChild(input)

  for (let key in licenceInfo.fields) {
    const addedInput = document.createElement('input')
    addedInput.setAttribute('name', key)
    addedInput.setAttribute('value', values[key] || licenceInfo.fields[key])
    form.appendChild(addedInput)
  }
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
  return false
}
