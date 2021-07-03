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

engine.ready(() => {
  content.powerups.on('apply', () => content.score.increment(100))
  content.train.on('add', () => content.score.increment(100))
})

engine.loop.on('frame', ({delta, paused}) => {
  if (paused) {
    return
  }

  content.score.increment(delta)
})

engine.state.on('reset', () => content.score.reset())
