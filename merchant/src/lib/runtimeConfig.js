export function getBoolValue(name, runtimeConfigs) {
  const rc = runtimeConfigs.find(rc => rc.name === name)

  if (!rc || !rc.value) {
    return false
  }

  return rc.value.bool
}
