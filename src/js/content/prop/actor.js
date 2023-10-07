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
    const context = engine.audio.context()

    this.difficulty = difficulty
    this.frequency = this.calculateFrequency()
    this.time = 0

    this.ducker = context.createGain()
    this.ducker.connect(this.output)

    this.footstepper = content.utility.footstepper.create({
      parameters: {
        destination: this.ducker,
      },
      position: this.vector(),
    })
  },
  onDestroy: function () {
    if (this.synth) {
      this.synth.stop()
    }
  },
  onUpdate: function ({delta, paused}) {
    if (this.isPowerup) {
      this.powerupGrain()
    }

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
    this.z = 0

    this.footstepper.update({
      position: this.vector(),
    })

    if (this.stability) {
      this.stability = content.utility.accelerateValue(this.stability, 0, 1)
    }

    if (this.running) {
      this.running = content.utility.accelerateValue(this.running, 0, 1)
    }

    if (this.taunted) {
      this.taunted = content.utility.accelerateValue(this.taunted, 0, 1)
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
    }).chainAssign('lfoTarget', context.createGain()).filtered({
      frequency: this.frequency,
    }).connect(this.ducker)

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
    const now = engine.audio.time()

    this.ducker.gain.setValueAtTime(this.ducker.gain.value, now)
    this.ducker.gain.linearRampToValueAtTime(engine.const.zeroGain, now + 1/64)
    this.ducker.gain.setValueAtTime(engine.const.zeroGain, now + 1/2)
    this.ducker.gain.linearRampToValueAtTime(1, now + 1)

    return this
  },
  moveTag: function () {
    // Determine destination
    const closestEnemy = content.train.quadtreeEnemy().find(this),
      closestFriendly = content.train.quadtreeFriendlyNoStability().find(this) || content.train.quadtreeFriendly().find(this),
      position = engine.position.getVector(),
      vector = this.vector()

    const avoid = (from, target) => {
      // Scale the dodge distance based on difficulty
      const scale = content.const.velocity * engine.utility.lerp(0, 1, this.difficulty)

      // Generate two points at right angles away
      const base = vector.subtract(from).normalize().scale(scale),
        v1 = base.rotateEuler({yaw: Math.PI/2}).add(from),
        v2 = base.rotateEuler({yaw: -Math.PI/2}).add(from)

      // Pick closest point to avoid crossing path
      return v1.distance(target) <= v2.distance(target) ? v1 : v2
    }

    const opposite = (from) => vector.subtract(from).normalize().add(vector)

    let destination = vector.clone()

    if (this.taunted) {
      destination = vector.distance(position) <= vector.distance(closestFriendly)
        ? position
        : avoid(closestFriendly, position)
    } else if (this.running) {
      destination = vector.distance(position) <= vector.distance(closestFriendly)
        ? opposite(position)
        : opposite(closestFriendly)
    } else if (closestFriendly) {
      destination = vector.distance(position) <= vector.distance(closestFriendly)
        ? avoid(position, closestFriendly)
        : engine.utility.vector3d.create(closestFriendly || {})

      destination = closestFriendly.stability && vector.distance(closestFriendly) < this.radius * 2
        ? opposite(closestFriendly)
        : destination
    }

    destination = vector.distance(destination) <= vector.distance(closestEnemy) || vector.distance(closestEnemy) > this.radius * 2
      ? destination
      : opposite(closestEnemy)

    // Roll the dice to apply the new target destination
    const fps = engine.performance.fps()

    const chance = (this.running || this.taunted)
      ? engine.utility.lerp(1/8, 1, this.difficulty)
      : engine.utility.lerp(1/16, 1/2, this.difficulty)

    if (Math.random() > chance / fps) {
      const velocity = destination.subtract(this).normalize().scale(content.const.velocity)

      const rate = this.velocity.distance() > velocity.distance()
        ? content.const.acceleration
        : content.const.deceleration

      this.velocity = content.utility.accelerateVector(this.velocity, velocity, rate)
    }

    return this
  },
  moveTrain: function () {
    const ahead = content.train.ahead(this),
      index = content.train.indexOf(this),
      position = engine.position.getVector(),
      vector = this.vector()

    let destination

    const nextHeading = index == 0
      ? engine.position.getQuaternion().forward()
      : ahead.vector().subtract(vector).normalize()

    this.heading = this.heading !== undefined
      ? content.utility.accelerateVector(this.heading, nextHeading, 8)
      : nextHeading

    if (index == 0) {
      destination = position.subtract(
        engine.utility.vector2d.create(
          engine.position.getQuaternion().forward()
        ).scale(this.radius * 3)
      )
    } else {
      /*
      const behind = ahead.vector().subtract(ahead.heading ? ahead.heading.scale(this.radius * 2) : {}),
        near = vector.subtract(ahead.vector()).normalize().scale(this.radius * 2).add(ahead.vector())

      destination = vector.distance(behind) <= vector.distance(near) + (this.radius * 2)
        ? behind
        : behind.add(near).scale(0.5)
      */

      destination = ahead.vector().subtract(ahead.heading ? ahead.heading.scale(this.radius * 2) : {})
    }

    this.velocity = destination.subtract(vector).normalize().scale(
      destination.subtract(vector).distance() * content.const.velocity
    )

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

    // Normalize velocity
    this.velocity = this.velocity.normalize().scale(
      Math.min(this.velocity.distance(), content.const.velocity)
    )

    // Unduck (obscure bug)
    engine.audio.ramp.set(this.ducker.gain, 1)

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
    }).connect(this.ducker)

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
