content.spawner = (() => {
  const bus = engine.audio.mixer.createBus(),
    pubsub = engine.utility.pubsub.create()

  const alliesByDistance = [],
    enemiesByDistance = []

  let timer = 0

  function calculateDifficulty() {
    const trainLength = content.train.length()
    return engine.utility.clamp(trainLength / 16, 0, 1)
  }

  function initializeGame() {
    const count = 10,
      distance = content.prop.actor.radius * 2,
      position = engine.position.getVector()

    for (let i = 0; i < count; i += 1) {
      const prop = engine.props.create(content.prop.actor, {
        destination: bus,
        difficulty: calculateDifficulty(),
        ...position.add({x: -(count - i) * distance}),
      })

      content.train.add(prop)
    }

    timer = 2
  }

  function shouldSpawn() {
    const difficulty = calculateDifficulty(),
      enemies = engine.props.get().filter((prop) => !prop.isTrain),
      maxEnemies = Math.floor(engine.utility.lerpExp(1, 4, difficulty, 0.5))

    if (enemies.length >= maxEnemies) {
      return false
    }

    timer -= engine.loop.delta()

    return timer <= 0
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

    timer = engine.utility.random.float(1, 3)
  }

  function updateDistances() {
    const props = engine.props.get()

    alliesByDistance.length = 0
    enemiesByDistance.length = 0

    for (const prop of props) {
      const stack = prop.isTrain ? alliesByDistance : enemiesByDistance
      stack.push(prop)
    }

    const sortByDistance = (a, b) => a.distance - b.distance

    alliesByDistance.sort(sortByDistance)
    enemiesByDistance.sort(sortByDistance)
  }

  return engine.utility.pubsub.decorate({
    bus: () => bus,
    difficulty: () => calculateDifficulty(),
    duck: function () {
      engine.audio.ramp.exponential(bus.gain, engine.const.zeroGain, 1)
      return this
    },
    enemiesByDistance: () => [...enemiesByDistance],
    getIndexByDistance: (prop) => alliesByDistance.includes(prop) ? alliesByDistance.indexOf(prop) : enemiesByDistance.indexOf(prop),
    import: function () {
      initializeGame()
      return this
    },
    reset: function () {
      alliesByDistance.length = 0
      enemiesByDistance.length = 0

      return this
    },
    unduck: function () {
      engine.audio.ramp.linear(bus.gain, 1, 1/16)
      return this
    },
    update: function () {
      if (shouldSpawn()) {
        spawn()
      }

      updateDistances()

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

engine.state.on('import', () => content.spawner.import())
engine.state.on('reset', () => content.spawner.reset())
