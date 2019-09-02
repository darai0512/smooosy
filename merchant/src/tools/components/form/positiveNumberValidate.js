export default function positiveNumberValidate(input) {
  if (input === '' || input === undefined) {
    return '必須項目です'
  }
  if (parseFloat(input) < 0) {
    return '負の値は入力できません'
  }
  return null
}