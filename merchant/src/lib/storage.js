const storage = JSON.parse((localStorage || {}).smooosy || '{}')

function get(key) {
  return storage[key]
}

function save(key, value) {
  storage[key] = value
  try {
    localStorage.setItem('smooosy', JSON.stringify(storage))
  } catch (e) {
    // empty
  }
}

function remove(key) {
  if (storage[key]) {
    delete storage[key]
    try {
      localStorage.setItem('smooosy', JSON.stringify(storage))
    } catch (e) {
      // empty
    }
  }
}

export default {
  get,
  save,
  remove,
}
