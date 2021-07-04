content.prop.actor = engine.prop.base.invent({
  name: 'actor',
  frequencies: [
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
  ].map(engine.utility.midiToFrequency),
  isTrain: false,
  radius: 0.5,
  running: 0,
  stability: 0,
  taunted: 0,
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
    this.footstepper.isMuted = content.spawner.getIndexByDistance(this) > (this.isTrain ? content.const.maxAllyFootsteps : content.const.maxEnemyFootsteps)
    this.footstepper.parameters.color = this.isTrain ? 1/4 : 4
    this.footstepper.parameters.frequency = this.frequency
    this.time += delta

    this.footstepper.update({
      position: this.vector(),
    })

    if (this.stability) {
      this.stability = content.utility.accelerate.value(this.stability, 0, 1)
    }

    if (this.running) {
      this.running = content.utility.accelerate.value(this.running, 0, 1)
    }

    if (this.taunted) {
      this.taunted = content.utility.accelerate.value(this.taunted, 0, 1)
    }

    if (this.needsSynth()) {
      if (!this.synth) {
        this.createSynth()
      }
      this.updateSynth()
    } else if (this.synth) {
      this.destroySynth()
    }

    if (this.isPowerup) {
      this.powerupGrain()
    }
  },
  calculateFrequency: function () {
    if (!this.isTrain) {
      return this.frequency || engine.utility.choose(this.frequencies, Math.random())
    }

    const index = content.train.indexOf(this)
    return this.frequencies[index % this.frequencies.length]
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
      detune: engine.utility.random.float(-10, 10),
      frequency: this.frequency,
      type: 'sawtooth',
    }).chainAssign('ducker', context.createGain()).chainAssign('lfoTarget', context.createGain()).filtered({
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
  duck: function () {
    if (!this.synth) {
      return this
    }

    const now = engine.audio.time()

    this.synth.ducker.gain.setValueAtTime(this.synth.ducker.gain.value, now)
    this.synth.ducker.gain.linearRampToValueAtTime(engine.const.zeroGain, now + engine.loop.delta())
    this.synth.ducker.gain.exponentialRampToValueAtTime(1, now + 1)

    return this
  },
  moveTag: function () {
    const chance = (this.running || this.taunted)
      ? engine.utility.lerp(1/8, 1, this.difficulty)
      : engine.utility.lerp(1/12, 3/4, this.difficulty)

    if (Math.random() > chance) {
      return this
    }

    const closest = content.train.quadtree().find(this),
      position = engine.position.getVector(),
      vector = this.vector()

    const avoid = (from, target) => {
      // Scale the dodge distance based on difficulty
      const scale = content.const.velocity * (this.taunted ? 1 : engine.utility.lerp(1/8, 1, this.difficulty))

      // Generate two points at right angles away
      const base = vector.subtract(from).normalize().scale(scale),
        v1 = base.rotateEuler({yaw: Math.PI/2}).add(from),
        v2 = base.rotateEuler({yaw: -Math.PI/2}).add(from)

      // Pick closest point to avoid crossing path
      return v1.distance(target) <= v2.distance(target)
        ? v1
        : v2
    }

    const opposite = (from) => vector.subtract(from).normalize().add(vector)

    let destination = vector.clone()

    if (this.taunted) {
      destination = vector.distance(position) < vector.distance(closest)
        ? position
        : avoid(closest, position)
    } else if (this.running) {
      destination = vector.distance(position) < vector.distance(closest)
        ? opposite(position)
        : opposite(closest)
    } else {
      destination = vector.distance(position) < vector.distance(closest)
        ? avoid(position, closest)
        : engine.utility.vector3d.create(closest)
    }

    const velocity = destination.subtract(this).normalize().scale(content.const.velocity)

    const rate = this.velocity.distance() > velocity.distance()
      ? content.const.acceleration
      : content.const.deceleration

    this.velocity = content.utility.accelerate.vector(this.velocity, velocity, rate)

    return this
  },
  moveTrain: function () {
    const index = content.train.indexOf(this),
      position = engine.position.getVector(),
      vector = this.vector()

    let destination = index > 0
      ? content.train.ahead(this).vector()
      : position

    let minStoppingDistance = index == 0
      ? 0
      : this.radius * 4

    if (index == 0) {
      // Point 180 degrees behind player
      destination = destination.add(
        engine.utility.vector3d.create({x: -this.radius * 5})
          .rotateQuaternion(engine.position.getQuaternion())
      )
    } else if (vector.distance(position) < this.radius * 4) {
      // Centroid between opposite point away from player and destination
      destination = vector.subtract(position).normalize().scale(this.radius * 4).add(vector)
        .add(destination).scale(1/2)

      minStoppingDistance = this.radius
    }

    const movementBonus = engine.utility.scale(Math.min(index, 10), 0, 10, 10, 1)

    const velocity = destination.distance(this) > this.calculateStoppingDistance(minStoppingDistance)
      ? destination.subtract(this).normalize().scale(content.const.velocity * movementBonus)
      : engine.utility.vector3d.create()

    const rate = this.velocity.distance() > velocity.distance()
      ? content.const.acceleration * movementBonus
      : content.const.deceleration * movementBonus

    this.velocity = content.utility.accelerate.vector(this.velocity, velocity, rate)

    return this
  },
  needsSynth: function () {
    return this.relative.x >= 0
  },
  onTrainAdd: function () {
    this.isTrain = true

    // Reset frequency
    delete this.frequency

    // Attach LFO
    if (this.synth && !this.synth.lfo) {
      engine.audio.ramp.set(this.synth.lfoTarget.gain, 0.5)
      this.synth.lfo = content.lfos.choose()
      this.synth.lfo.connect(this.synth.lfoTarget.gain)
    }

    // Accumulate stability bonus from previous ally (can stack)
    const stability = (content.train.behind(this) || {}).stability || 0
    this.stable(1 + stability)

    this.duck()

    return this
  },
  onTrainRemove: function () {
    this.isTrain = false

    // Reset frequency
    delete this.frequency

    // Detach LFO
    if (this.synth && this.synth.lfo) {
      engine.audio.ramp.set(this.synth.lfoTarget.gain, 1)
      this.synth.lfo.disconnect(this.synth.lfoTarget.gain)
      delete this.synth.lfo
    }

    // Run away briefly
    this.stable(1).run(
      engine.utility.lerpRandom([4,6], [1,2], this.difficulty)
    )

    return this
  },
  powerupGrain: function () {
    const fps = engine.performance.fps()

    if (Math.random() > 1/fps*8) {
      return this
    }

    const frequency = engine.utility.choose(this.frequencies, Math.random()) * 4

    const synth = engine.audio.synth.createSimple({
      frequency: frequency,
      type: 'triangle',
    }).filtered({
      frequency: frequency * engine.utility.random.float(0.5, 4),
    }).connect(this.output)

    const duration = 1/2,
      now = engine.audio.time()

    synth.param.gain.linearRampToValueAtTime(engine.utility.fromDb(-10.5), now + duration/2)
    synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, now + duration)
    synth.stop(now + duration)

    return this
  },
  run: function (time = 1) {
    this.running = time
    return this
  },
  stable: function (time = 1) {
    this.stability = time
    return this
  },
  taunt: function (time = 1) {
    this.taunted = time
    return this
  },
  updateSynth: function () {
    const angle = Math.atan2(this.relative.y, this.relative.x),
      strength = engine.utility.scale(Math.abs(angle), 0, Math.PI/2, 1, 0)

    const color = engine.utility.lerpExp(1, 4, strength, 3)

    let gain = (strength ** 2) / 2

    engine.audio.ramp.set(this.synth.filter.frequency, this.frequency * color)
    engine.audio.ramp.set(this.synth.param.frequency, this.frequency)
    engine.audio.ramp.set(this.synth.param.gain, gain)

    return this
  },
})
