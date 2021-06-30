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

    this.frequency = this.calculateFrequency()
    this.time = 0
  },
  onDestroy: function () {
    if (this.synth) {
      this.synth.stop()
    }
  },
  onUpdate: function ({delta, paused}) {
    if (paused) {
      return this
    }

    if (this.isTrain) {
      this.moveTrain()
    } else {
      this.moveTag()
    }

    this.frequency = this.calculateFrequency()
    this.footstepper.parameters.color = this.isTrain ? 1/4 : 4
    this.footstepper.parameters.frequency = this.frequency
    this.time += delta

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

    if (!this.isTrain) {
      return this.frequency || engine.utility.midiToFrequency(engine.utility.choose(notes, Math.random()))
    }

    const index = content.train.indexOf(this)
    const note = notes[index % notes.length]

    if (this.midiNote == note) {
      return this.frequency
    }

    this.midiNote = note
    return engine.utility.midiToFrequency(note)
  },
  calculateStoppingDistance: function (minimum = this.radius) {
    const deceleration = content.const.deceleration,
      delta = engine.loop.delta(),
      velocity = this.velocity.distance()

    return minimum + (velocity * delta) + ((velocity ** 2) / (2 * deceleration))
  },
  createSynth: function () {
    const context = engine.audio.context()

    this.synth = engine.audio.synth.createSimple({
      frequency: this.frequency,
      type: 'sawtooth',
    }).chainAssign('lfoTarget', context.createGain()).filtered({
      frequency: this.frequency,
    }).connect(this.output)

    if (this.isTrain) {
      this.synth.lfo = content.lfos.choose()
      this.synth.lfo.connect(this.synth.lfoTarget.gain)
      engine.audio.ramp.set(this.synth.lfoTarget.gain, 0.5)
    }

    return this
  },
  destroySynth: function () {
    const release = engine.audio.time(1/8)

    this.synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, release)
    this.synth.stop(release)

    if (this.synth.lfo) {
      this.synth.lfo.disconnect(this.synth.lfoTarget.gain)
    }

    delete this.synth

    return this
  },
  invincible: function (time = 1) {
    this.invincibility = time
    return this
  },
  moveTag: function () {
    const chance = engine.utility.lerp(1/12, 1/2, this.difficulty)

    if (Math.random() > chance) {
      return this
    }

    const closest = content.train.quadtree().find(this),
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

    const velocity = destination.subtract(this).normalize().scale(content.const.velocity)
    this.velocity = content.utility.accelerate.vector(this.velocity, velocity, content.const.acceleration)

    return this
  },
  moveTrain: function () {
    const index = content.train.indexOf(this)

    const target = index > 0
      ? content.train.get(index - 1).vector()
      : engine.position.getVector()

    const destination = target.add(
      index == 0
        ? engine.utility.vector3d.create({x: -this.radius * 4}).rotateQuaternion(engine.position.getQuaternion())
        : {}
    )

    const minimum = index == 0
      ? 0
      : this.radius * 4

    const velocity = destination.distance(this) > this.calculateStoppingDistance(minimum)
      ? destination.subtract(this).normalize().scale(content.const.velocity)
      : engine.utility.vector3d.create()

    const rate = this.velocity.distance() > velocity.distance()
      ? content.const.acceleration
      : content.const.deceleration

    this.velocity = content.utility.accelerate.vector(this.velocity, velocity, rate)

    return this
  },
  needsSynth: function () {
    return this.relative.x >= 0
  },
  onTrainAdd: function () {
    delete this.frequency
    this.invincible(1.5)
    this.isTrain = true

    if (this.synth && !this.synth.lfo) {
      engine.audio.ramp.set(this.synth.lfoTarget.gain, 0.5)
      this.synth.lfo = content.lfos.choose()
      this.synth.lfo.connect(this.synth.lfoTarget.gain)
    }

    return this
  },
  onTrainRemove: function () {
    delete this.frequency
    this.invincible(1).run(engine.utility.lerpRandom([4,6], [1,2], this.difficulty))
    this.isTrain = false

    if (this.synth && this.synth.lfo) {
      engine.audio.ramp.set(this.synth.lfoTarget.gain, 1)
      this.synth.lfo.disconnect(this.synth.lfoTarget.gain)
      delete this.synth.lfo
    }

    return this
  },
  run: function (time = 1) {
    this.running = time
    return this
  },
  updateSynth: function () {
    const angle = Math.atan2(this.relative.y, this.relative.x),
      strength = engine.utility.scale(Math.abs(angle), 0, Math.PI/2, 1, 0)

    const color = engine.utility.lerpExp(1, 4, strength, 3)

    let gain = (strength ** 2) * (this.invincibility ? engine.utility.clamp(1 - this.invincibility, 0, 1) ** 2 : 1) / 2

    engine.audio.ramp.set(this.synth.filter.frequency, this.frequency * color)
    engine.audio.ramp.set(this.synth.param.frequency, this.frequency)
    engine.audio.ramp.set(this.synth.param.gain, gain)

    return this
  },
})
