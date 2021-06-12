content.prop.actor = engine.prop.base.invent({
  name: 'actor',
  invincibility: 0,
  isTrain: false,
  radius: 0.5,
  running: 0,
  onConstruct: function ({
    difficulty = 0,
  } = {}) {
    this.difficulty = difficulty

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
    this.footstepper.parameters.color = this.isTrain ? 1/4 : 4
    this.footstepper.parameters.frequency = this.frequency

    this.footstepper.update({
      position: this.vector(),
    })

    if (this.invincibility) {
      this.invincibility = content.utility.accelerate.value(this.invincibility, 0, 1)
    }

    if (this.running) {
      this.running = content.utility.accelerate.value(this.running, 0, 1)
    }

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
      carrierFrequency: this.frequency,
      carrierType: this.isTrain ? 'sawtooth' : 'square',
      modFrequency: engine.utility.random.float(7, 9),
    }).filtered({
      frequency: this.frequency / 2,
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
  invincible: function (time = 1) {
    this.invincibility = time
    return this
  },
  moveTag: function () {
    const chance = engine.utility.lerp(1/12, 1/3, this.difficulty)

    if (Math.random() > chance) {
      return this
    }

    const closest = content.train.quadtree().find(this, this.radius),
      position = engine.position.getVector(),
      vector = this.vector()

    let destination = vector.clone()
    let opposite = (from) => vector.subtract(from).normalize().add(vector)

    if (this.running) {
      destination = vector.distance(position) < vector.distance(closest)
        ? opposite(position)
        : opposite(closest)
    } else {
      destination = vector.distance(position) < 1
        ? opposite(position)
        : engine.utility.vector3d.create(closest)
    }

    const velocity = destination.subtract(this).normalize().scale(4) // max velocity
    this.velocity = content.utility.accelerate.vector(this.velocity, velocity, 4) // accelerate

    return this
  },
  moveTrain: function () {
    const index = content.train.indexOf(this)

    const destination = index > 0
      ? content.train.get(index - 1).vector()
      : engine.position.getVector()

    const velocity = destination.distance(this) > this.calculateStoppingDistance()
      ? destination.subtract(this).normalize().scale(4) // max velocity
      : engine.utility.vector3d.create() // zero

    const rate = this.velocity.distance() > velocity.distance()
      ? 4 // accelerate
      : 8 // decelerate

    this.velocity = content.utility.accelerate.vector(this.velocity, velocity, rate)

    return this
  },
  needsSynth: function () {
    if (this.invincibility) {
      return false
    }

    const angle = Math.atan2(this.relative.y, this.relative.x)
    return engine.utility.between(angle, -Math.PI/2, Math.PI/2)
  },
  onTrainAdd: function () {
    delete this.frequency
    this.invincible(5)
    this.isTrain = true
    return this
  },
  onTrainRemove: function () {
    delete this.frequency
    this.invincible().run()
    this.isTrain = false
    return this
  },
  run: function (time = 5) {
    this.running = time
    return this
  },
  updateSynth: function () {
    const angle = Math.atan2(this.relative.y, this.relative.x),
      strength = engine.utility.scale(Math.abs(angle), 0, Math.PI/2, 1, 0)

    const amodDepth = this.isTrain ? 1/2 : 0

    engine.audio.ramp.set(this.synth.param.carrierGain, 1 - amodDepth)
    engine.audio.ramp.set(this.synth.param.frequency, this.frequency)
    engine.audio.ramp.set(this.synth.param.gain, strength ** 2)
    engine.audio.ramp.set(this.synth.param.mod.depth, amodDepth)

    return this
  },
})
