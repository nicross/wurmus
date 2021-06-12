content.train = (() => {
  const pubsub = engine.utility.pubsub.create(),
    train = []

  return engine.utility.pubsub.decorate({
    add: function (prop) {
      if (!this.has(prop)) {
        train.unshift(prop)
        pubsub.emit('add', prop)
      }

      return this
    },
    get: (index) => train[index],
    has: (prop) => train.includes(prop),
    length: () => train.length,
    remove: function () {
      const index = train.indexOf(prop)

      if (index > -1) {
        pubsub.emit('remove', train.splice(index))
      }

      return this
    },
    reset: function () {
      train.length = 0
      return this
    },
  }, pubsub)
})()
