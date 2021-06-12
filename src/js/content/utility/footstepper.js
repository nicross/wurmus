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
    return this
  },
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
      content.sfx.footstep({
        ...this.parameters,
      })

      this.position = engine.utility.vector3d.create(position)
    }

    return this
  },
}
