content.utility.footstepper = {}

content.utility.footstepper.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

content.utility.footstepper.prototype = {
  construct: function ({
    distance = 0.5,
    parameters = {},
    position = {},
  } = {}) {
    this.distance = distance
    this.parameters = parameters
    this.position = engine.utility.vector3d.create(position)

    this.pubsub = engine.utility.pubsub.create()
    engine.utility.pubsub.decorate(this, this.pubsub)

    return this
  },
  isMuted: false,
  reset: function ({
    position = {},
  } = {}) {
    this.position = engine.utility.vector3d.create(position)
    return this
  },
  update: function ({
    position,
  } = {}) {
    const distance = this.position.distance(position),
      shouldTrigger = distance >= this.distance

    if (shouldTrigger) {
      if (!this.isMuted) {
        content.sfx.footstep({
          ...this.parameters,
        })

        this.emit('step')
      }

      this.position = engine.utility.vector3d.create(position)
    }

    return this
  },
}
