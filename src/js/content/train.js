content.train = (() => {
  const pubsub = engine.utility.pubsub.create(),
    train = []

  return engine.utility.pubsub.decorate({
    add: function (prop) {
      if (this.has(prop)) {
        return this
      }

      prop.onTrainAdd()
      train.unshift(prop)
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
    length: () => train.length,
    quadtree: () => engine.utility.quadtree.from(train),
    remove: function (prop) {
      const index = train.indexOf(prop)

      if (index == -1) {
        return this
      }

      const props = train.splice(index)

      for (const prop of props) {
        prop.onTrainRemove()
      }

      pubsub.emit('remove', props)

      return this
    },
    reset: function () {
      train.length = 0
      return this
    },
  }, pubsub)
})()

engine.state.on('reset', () => content.train.reset())
