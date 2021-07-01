content.powerups = (() => {
  const pubsub = engine.utility.pubsub.create(),
    registry = new Map(),
    spawnChance = 1/8

  function applyRandomPowerup() {
    const powerup = chooseRandomPowerup()
    powerup.apply()
    pubsub.emit('apply', powerup)
  }

  function chooseRandomPowerup() {
    return engine.utility.choose([...registry.values()], Math.random())
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

  function shouldSpawnPowerup() {
    return !hasSpawnedPowerups() && (Math.random() < spawnChance)
  }

  return engine.utility.pubsub.decorate({
    choose: () => chooseRandomPowerup(),
    onSpawnerSpawn: function (prop) {
      if (shouldSpawnPowerup()) {
        prop.isPowerup = true
      }

      return this
    },
    onTrainAdd: function () {
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
      powerups.set(definition.key, definition)
      return definition
    },
  }, pubsub)
})()

engine.ready(() => {
  content.spawner.on('spawn', (prop) => content.powerups.onSpawnerSpawn(prop))
  content.train.on('add', (prop) => content.powerups.onTrainAdd(prop))
  content.train.on('remove', (prop) => content.powerups.onTrainRemove(prop))
})
