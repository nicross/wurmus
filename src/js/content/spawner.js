content.spawner = (() => {
  function generateOptions() {
    return {}
  }

  function initializeGame() {
    const count = 1,
      distance = content.prop.actor.radius * 2,
      position = engine.position.getVector()

    for (let i = 0; i < count; i += 1) {
      const prop = engine.props.create(content.prop.actor, {
        ...generateOptions(),
        ...position.add({x: -(i + 1) * distance}),
      })

      content.train.add(prop)
    }
  }

  return {
    import: function () {
      initializeGame()
      return this
    },
    reset: function () {
      return this
    },
    update: function () {
      // Spawn waves
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

engine.state.on('import', () => content.spawner.import())
engine.state.on('reset', () => content.spawner.reset())
