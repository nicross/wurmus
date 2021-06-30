content.spawner = (() => {
  const bus = engine.audio.mixer.createBus(),
    pubsub = engine.utility.pubsub.create()

  function calculateDifficulty() {
    const trainLength = content.train.length()
    return engine.utility.clamp(trainLength / 8, 0, 1)
  }

  function initializeGame() {
    const count = 10,
      distance = content.prop.actor.radius * 4,
      position = engine.position.getVector()

    for (let i = 0; i < count; i += 1) {
      const prop = engine.props.create(content.prop.actor, {
        destination: bus,
        difficulty: 0,
        ...position.add({x: -(count - i) * distance}),
      })

      content.train.add(prop)
    }
  }

  function shouldSpawn() {
    const difficulty = calculateDifficulty(),
      enemies = engine.props.get().filter((prop) => !prop.isTrain),
      maxEnemies = engine.utility.lerpExp(1, 3, difficulty, 1.25)

    if (enemies.length >= Math.round(maxEnemies)) {
      return false
    }

    const fps = engine.performance.fps()
    const chance = engine.utility.lerp(1/2/fps, 1/fps, difficulty)

    return Math.random() < chance
  }

  function spawn() {
    const angle = engine.utility.random.float() * 2 * Math.PI,
      distance = 50,
      position = engine.position.getVector()

    const delta = position.add({
      x: distance * Math.cos(angle),
      y: distance * Math.sin(angle),
    })

    const prop = engine.props.create(content.prop.actor, {
      destination: bus,
      difficulty: engine.utility.lerpRandom([0, 1/8], [7/8, 1], calculateDifficulty()),
      ...delta,
    })

    pubsub.emit('spawn', prop)
  }

  return engine.utility.pubsub.decorate({
    bus: () => bus,
    difficulty: () => calculateDifficulty(),
    import: function () {
      initializeGame()
      return this
    },
    onPause: function () {
      engine.audio.ramp.exponential(bus.gain, engine.const.zeroGain, 1)
      return this
    },
    onResume: function () {
      engine.audio.ramp.set(bus.gain, 1)
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
  }, pubsub)
})()

engine.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  content.spawner.update()
})

// XXX: Ride prop bus gain based on loop state (via app.screen.game)
engine.loop.on('pause', () => content.spawner.onPause())
engine.loop.on('resume', () => content.spawner.onResume())

engine.state.on('import', () => content.spawner.import())
engine.state.on('reset', () => content.spawner.reset())
