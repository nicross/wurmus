content.time = (() => {
  let time = 0

  return {
    get: () => time,
    increment: function (value = 0) {
      time += value
      return this
    },
    reset: function () {
      time = 0
      return this
    },
  }
})()

engine.loop.on('frame', ({delta, paused}) => {
  if (paused) {
    return
  }

  content.time.increment(delta)
})

engine.state.on('reset', () => content.time.reset())
