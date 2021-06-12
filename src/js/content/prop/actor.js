content.prop.actor = engine.prop.base.invent({
  name: 'actor',
  radius: 0.5,
  onConstruct: function () {
    this.footstepper = content.utility.footstepper.create({
      parameters: {
        destination: this.input,
      },
      position: this.vector(),
    })
  },
  onDestroy: function () {

  },
  onTrainAdd: function () {
    this.isTrain = true
    return this
  },
  onTrainRemove: function () {
    this.isTrain = false
    return this
  },
  onUpdate: function () {
    if (this.isTrain) {
      this.moveTrain()
    } else {
      this.moveTag()
    }

    this.footstepper.update({
      position: this.vector(),
    })
  },
  calculateStoppingDistance: function () {
    const deceleration = 8,
      delta = engine.loop.delta(),
      minimum = this.radius * 2,
      velocity = this.velocity.distance()

    return minimum + (velocity * delta) + ((velocity ** 2) / (2 * deceleration))
  },
  moveTag: function () {
    // Roll whether to update based on difficulty
    // Calculate desired position
      // If running away, or closest is player, opposite direction from player
      // Otherwise closest train actor
    // Accelerate toward it

    return this
  },
  moveTrain: function () {
    const index = content.train.indexOf(this)

    const ahead = index > 0
      ? content.train.get(index - 1).vector()
      : engine.position.getVector()

    const velocity = ahead.distance(this) > this.calculateStoppingDistance()
      ? ahead.subtract(this).normalize().scale(4) // max velocity
      : engine.utility.vector3d.create() // zero

    const rate = this.velocity.distance() > velocity.distance()
      ? 4 // accelerate
      : 8 // decelerate

    this.velocity = content.utility.accelerate.vector(this.velocity, velocity, rate)

    return this
  },
})
