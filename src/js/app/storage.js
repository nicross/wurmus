app.storage = (() => {
  const isSupported = 'localStorage' in window

  const storage = isSupported
    ? window.localStorage
    : {
        data: {},
        getItem: function (key) {this.data[key]},
        removeItem: (key) => delete this.data[key],
        setItem: function (key) {this.data[key] = value},
      }

  const highscoreKey = 'wurmus_highscore',
    settingsKey = 'wurmus_settings'

  function get(key) {
    try {
      const value = storage.getItem(key)
      return JSON.parse(value)
    } catch (e) {}
  }

  function remove(key) {
    return storage.removeItem(key)
  }

  function set(key, value) {
    try {
      storage.setItem(key, JSON.stringify(value))
    } catch (e) {}
  }

  return {
    clearHighscore: function () {
      return this.setHighscore(0)
    },
    getHighscore: () => Number(get(highscoreKey)) || 0,
    getSettings: () => get(settingsKey) || {},
    hasHighscore: function () {
      return Boolean(this.getHighscore())
    },
    setHighscore: function (value) {
      set(highscoreKey, value)
      return this
    },
    setSettings: function (value) {
      set(settingsKey, value)
      return this
    },
  }
})()
