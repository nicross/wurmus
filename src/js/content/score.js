content.score = (() => {
  let score = 0

  return {
    get: () => score,
    increment: function (value = 0) {
      score += value
      return this
    },
    reset: function () {
      score = 0
      return this
    },
  }
})()

engine.loop.on('frame', ({delta, paused}) => {
  if (paused) {
    return
  }

  content.score.increment(delta)
})

engine.state.on('reset', () => content.score.reset())