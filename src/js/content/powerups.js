content.powerups = (() => {
  const pubsub = engine.utility.pubsub.create(),
    registry = new Map(),
    spawnChance = 1/4

  let bus = engine.audio.mixer.createBus()

  function applyRandomPowerup() {
    const powerup = chooseRandomPowerup()
    powerup.apply()
    pubsub.emit('apply', powerup)
  }

  function chooseRandomPowerup() {
    return engine.utility.chooseWeighted([...registry.values()], Math.random())
  }

  function hasSpawnedPowerups() {
    const props = engine.props.get()

    for (const prop of props) {
      if (prop.isPowerup) {
        return true
      }
    }

    return false
  }

  function killBus() {
    engine.audio.ramp.exponential(bus.gain, engine.const.zeroGain, 1)
    bus = engine.audio.mixer.createBus()
  }

  function shouldSpawnPowerup() {
    if (hasSpawnedPowerups()) {
      return false
    }

    if (engine.props.get().length < content.train.length() + 2) {
      return false
    }

    return Math.random() < spawnChance
  }

  return engine.utility.pubsub.decorate({
    bus: () => bus,
    choose: () => chooseRandomPowerup(),
    onPause: function () {
      killBus()
      return this
    },
    onSpawnerSpawn: function (prop) {
      if (shouldSpawnPowerup()) {
        prop.isPowerup = true
      }

      return this
    },
    onTrainAdd: function (prop) {
      if (prop.isPowerup) {
        prop.isPowerup = false
        applyRandomPowerup()
      }

      return this
    },
    onTrainRemove: function (props) {
      if (hasSpawnedPowerups()) {
        return this
      }

      for (const prop of props) {
        if (shouldSpawnPowerup()) {
          prop.isPowerup = true
          break
        }
      }

      return this
    },
    register: (definition) => {
      registry.set(definition.key, definition)
      return definition
    },
  }, pubsub)
})()

engine.ready(() => {
  content.spawner.on('spawn', (prop) => content.powerups.onSpawnerSpawn(prop))
  content.train.on('add', (prop) => content.powerups.onTrainAdd(prop))
  content.train.on('remove', (prop) => content.powerups.onTrainRemove(prop))
})

engine.loop.on('pause', () => content.powerups.onPause())
