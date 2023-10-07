content.train = (() => {
  const positions = [],
    pubsub = engine.utility.pubsub.create(),
    train = []

  function pushPosition(prop) {
    const last = positions[positions.length - 1]

    positions.push({
      heading: (
        last
          ? last.heading
          : engine.position.getQuaternion().forward()
      ),
      vector: (
        last
          ? last.vector
          : engine.position.getVector().subtract(
              engine.utility.vector2d.create(
                engine.position.getQuaternion().forward()
              ).scale(content.prop.actor.radius * 3)
            )
      ),
      velocity: (
        last
          ? last.velocity
          : engine.position.getVelocity()
      ),
    })
  }

  function updatePositions() {
    for (let index = 0; index < positions.length; index += 1) {
      const ahead = positions[index - 1],
        current = positions[index]

      const targetHeading = index == 0
        ? engine.position.getQuaternion().forward()
        : ahead.vector.subtract(current.vector).normalize()

      current.heading = content.utility.accelerateVector(current.heading, targetHeading, 8)

      const destination = index == 0
        ? engine.position.getVector().subtract(
            engine.utility.vector2d.create(
              engine.position.getQuaternion().forward()
            ).scale(content.prop.actor.radius * 3)
          )
        : ahead.vector.subtract(ahead.heading.scale(content.prop.actor.radius * 2))

      current.velocity = destination.subtract(current.vector).normalize().scale(
        destination.subtract(current.vector).distance() * content.const.velocity * 1.5
      )

      current.vector = current.vector.add(
        current.velocity.scale(
          engine.loop.delta()
        )
      )
    }
  }

  return engine.utility.pubsub.decorate({
    add: function (prop) {
      if (this.has(prop)) {
        return this
      }

      prop.onTrainAdd()
      train.unshift(prop)
      pushPosition(prop)
      pubsub.emit('add', prop)

      return this
    },
    ahead: (prop) => {
      const index = train.indexOf(prop)
      return train[index - 1]
    },
    behind: (prop) => {
      const index = train.indexOf(prop)
      return train[index + 1]
    },
    get: (index) => train[index],
    has: (prop) => train.includes(prop),
    indexOf: (prop) => train.indexOf(prop),
    positionAt: (index) => positions[index],
    length: () => train.length,
    quadtreeEnemy: () => engine.utility.quadtree.from(
      engine.props.get().filter((prop) => !prop.isTrain)
    ),
    quadtreeFriendly: () => engine.utility.quadtree.from(train),
    quadtreeFriendlyNoStability: () => engine.utility.quadtree.from(train.filter((prop) => !prop.stability)),
    remove: function (prop) {
      const index = train.indexOf(prop)

      if (index == -1) {
        return this
      }

      const props = train.splice(index)
      positions.splice(index)

      for (const prop of props) {
        prop.onTrainRemove()
      }

      pubsub.emit('remove', props)

      return this
    },
    reset: function () {
      positions.length = 0
      train.length = 0

      return this
    },
    update: function () {
      updatePositions()

      return this
    },
  }, pubsub)
})()

engine.loop.on('frame', () => content.train.update())
engine.state.on('reset', () => content.train.reset())
