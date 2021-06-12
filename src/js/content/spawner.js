content.spawner = (() => {
  function calculateDifficulty() {
    const actors = engine.props.get().filter((prop) => prop.isTrain).length
    return engine.utility.clamp(actors / 8, 0, 1)
  }

  function initializeGame() {
    const count = 1,
      distance = content.prop.actor.radius * 2,
      position = engine.position.getVector()

    for (let i = 0; i < count; i += 1) {
      const prop = engine.props.create(content.prop.actor, {
        difficulty: 0,
        ...position.add({x: -(i + 1) * distance}),
      })

      content.train.add(prop)
    }
  }

  function shouldSpawn() {
    const difficulty = calculateDifficulty(),
      enemies = engine.props.get().filter((prop) => !prop.isTrain),
      maxEnemies = engine.utility.lerp(1, 3, difficulty)

    if (!enemies.length) {
      return true
    }

    if (enemies.length >= maxEnemies) {
      return false
    }

    const fps = engine.performance.fps()
    const chance = engine.utility.lerp(1/8/fps, 1/fps, difficulty)

    return Math.random() < chance
  }

  function spawn() {
    const position = engine.position.getVector()
    const {yaw} = engine.position.getEuler()

    const angle = engine.utility.random.float() * Math.PI/4,
      distance = 50

    const delta = position.add({
      x: distance * Math.cos(angle + yaw),
      y: distance * Math.sin(angle + yaw),
    })

    engine.props.create(content.prop.actor, {
      difficulty: calculateDifficulty(),
      ...delta,
    })
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
      if (shouldSpawn()) {
        spawn()
      }

      return this
    },
  }
})()

engine.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  content.spawner.update()
})

engine.state.on('import', () => content.spawner.import())
engine.state.on('reset', () => content.spawner.reset())
