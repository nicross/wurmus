content.prop.actor = engine.prop.base.invent({
  name: 'actor',
  radius: 0.5,
  onConstruct: function () {
    this.footstepper = content.utility.footstepper.create({
      parameters: {
        destination: this.output,
      },
      position: this.vector(),
    })
  },
  onDestroy: function () {
    if (this.synth) {
      this.synth.stop()
    }
  },
  onUpdate: function () {
    if (this.isTrain) {
      this.moveTrain()
    } else {
      this.moveTag()
    }

    this.frequency = this.calculateFrequency()
    this.footstepper.parameters.color = this.isTrain ? 0.5 : 2
    this.footstepper.parameters.frequency = this.frequency

    this.footstepper.update({
      position: this.vector(),
    })

    if (this.needsSynth()) {
      if (!this.synth) {
        this.createSynth()
      }
      this.updateSynth()
    } else if (this.synth) {
      this.destroySynth()
    }
  },
  calculateFrequency: function () {
    if (!this.isTrain) {
      return this.frequency || engine.utility.midiToFrequency(engine.utility.random.float(48, 72))
    }

    const notes = [
      71,
      69,
      67,
      65,
      64,
      62,
      60,
      59,
      57,
      55,
      53,
      52,
      50,
      48,
    ]

    const index = content.train.indexOf(this)
    const note = notes[index % notes.length]

    if (this.midiNote == note) {
      return this.frequency
    }

    this.midiNote = note
    return engine.utility.midiToFrequency(note)
  },
  calculateStoppingDistance: function () {
    const deceleration = 8,
      delta = engine.loop.delta(),
      minimum = this.radius * 4,
      velocity = this.velocity.distance()

    return minimum + (velocity * delta) + ((velocity ** 2) / (2 * deceleration))
  },
  createSynth: function () {
    this.synth = engine.audio.synth.createAm({
      frequency: this.frequency,
      modFrequency: engine.utility.random.float(9, 11),
    }).connect(this.output)

    return this
  },
  destroySynth: function () {
    const release = engine.audio.time(1/8)

    this.synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, release)
    this.synth.stop(release)

    delete this.synth

    return this
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
  needsSynth: function () {
    const angle = Math.atan2(this.relative.y, this.relative.x)
    return engine.utility.between(angle, -Math.PI/4, Math.PI/4)
  },
  onTrainAdd: function () {
    delete this.frequency
    this.isTrain = true
    return this
  },
  onTrainRemove: function () {
    delete this.frequency
    this.isTrain = false
    return this
  },
  updateSynth: function () {
    const angle = Math.atan2(this.relative.y, this.relative.x),
      strength = engine.utility.scale(Math.abs(angle), 0, Math.PI/4, 1, 0)

    const amodDepth = this.isTrain ? 1/2 : 0

    engine.audio.ramp.set(this.synth.param.carrierGain, 1 - amodDepth)
    engine.audio.ramp.set(this.synth.param.frequency, this.frequency)
    engine.audio.ramp.set(this.synth.param.gain, strength)
    engine.audio.ramp.set(this.synth.param.mod.depth, amodDepth)

    return this
  },
})
