content.prop.actor = engine.prop.base.invent({
  name: 'actor',
  fadeInDuration: 1/4,
  fadeOutDuration: 1/4,
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

    this.applyGlobalPowerups()
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

    if (this.synth) {
      this.updateSynth()
    }
  },
  applyGlobalPowerups: function () {
    if (this.isTrain) {
      return
    }

    this.run(content.powerups.fear.value)
    this.taunt(content.powerups.taunt.value)

    return this
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
      // Scale the dodge distance based on difficulty and behavior
      const scale = content.const.velocity * (
        engine.utility.lerp(0, 2, (this.running || this.taunted) ? 1 : this.difficulty)
      )

      // Generate two points at right angles away
      const base = vector.subtract(from).normalize().scale(scale),
        v1 = base.rotateEuler({yaw: Math.PI/2}).add(from),
        v2 = base.rotateEuler({yaw: -Math.PI/2}).add(from)

      // Pick closest point to avoid crossing path
      return v1.distance(target) <= v2.distance(target) ? v1 : v2
    }

    const opposite = (from) => vector.subtract(from).normalize().add(vector)

    // Determine best destination for current behavior
    let destination = vector.clone()

    if (this.running) {
      destination = vector.distance(position) <= vector.distance(closestFriendly)
        ? opposite(position)
        : opposite(closestFriendly)
    } else if (this.taunted) {
      destination = vector.distance(position) <= vector.distance(closestFriendly)
        ? position
        : avoid(closestFriendly, position)
    } else if (closestFriendly) {
      destination = vector.distance(position) <= vector.distance(closestFriendly)
        ? avoid(position, closestFriendly)
        : engine.utility.vector3d.create(closestFriendly)
    }

    // Avoid stable friendlies that are too close
    const friendlyTooClose = closestFriendly && closestFriendly.stability
      && vector.distance(closestFriendly) < this.radius * 3

    if (friendlyTooClose) {
      destination = opposite(closestFriendly)
    }

    // Avoid enemies that are too close
    const enemyTooClose = closestEnemy
      && vector.distance(closestEnemy) < this.radius * 2

    if (enemyTooClose) {
      destination = opposite(closestEnemy)
    }

    // Roll the dice to apply the new target destination
    const fps = engine.performance.fps()

    const chance = (this.running || this.taunted || enemyTooClose || friendlyTooClose)
      ? 1
      : engine.utility.lerp(1, 8, this.difficulty) / fps

    if (Math.random() <= chance) {
      this.targetVelocity = destination.subtract(this).normalize().scale(content.const.velocity - (1 - this.difficulty))
    }

    if (this.targetVelocity) {
      const rate = this.velocity.distance() > this.targetVelocity.distance()
        ? content.const.acceleration
        : content.const.deceleration

      this.velocity = content.utility.accelerateVector(this.velocity, this.targetVelocity, rate)
    }

    return this
  },
  moveTrain: function () {
    /*
     * Smoothly transition between indices on capture.
     * Prop keeps track of their currentIndex which is a float.
     * We accelerate the float to the target index every frame.
     * The resulting position is the interpolated value of the positions the float lies between.
     */
    const nextIndex = content.train.indexOf(this),
      previousIndex = nextIndex - 1

    const previousVector = nextIndex == 0
      ? this.captureVector
      : content.train.positionAt(previousIndex).vector

    const nextPosition = content.train.positionAt(nextIndex)

    this.currentIndex = content.utility.accelerateValue(this.currentIndex, nextIndex, 4)

    const delta = engine.utility.clamp(engine.utility.scale(this.currentIndex, previousIndex, nextIndex, 0, 1)),
      x = engine.utility.lerp(previousVector.x, nextPosition.vector.x, delta),
      y = engine.utility.lerp(previousVector.y, nextPosition.vector.y, delta)

    this.velocity = nextPosition.velocity
    this.x = x
    this.y = y

    return this
  },
  onTrainAdd: function () {
    this.isTrain = true

    this.captureVector = this.vector()
    this.currentIndex = -1

    // Reset frequency
    delete this.frequency

    // Attach LFO
    if (this.synth && !this.synth.lfo) {
      engine.audio.ramp.set(this.synth.lfoTarget.gain, 0.5)
      this.synth.lfo = content.lfos.choose()
      this.synth.lfo.connect(this.synth.lfoTarget.gain)
    }

    this.duck()

    // Reset other bonuses
    this.running = 0
    this.stability = 1 + content.powerups.stability.value
    this.taunted = 0

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
    this.applyGlobalPowerups()
    this.running = Math.max(this.running, engine.utility.lerpRandom([4,6], [1,2], this.difficulty))
    this.stability = 1

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
    this.running = Math.max(0, this.running || 0) + time
    return this
  },
  setAudibility: function (value) {
    if (value && !this.synth) {
      this.createSynth()
    } else if (!value && this.synth) {
      this.destroySynth()
    }

    return this
  },
  stable: function (time = 1) {
    this.stability = Math.max(0, this.stability || 0) + time
    return this
  },
  taunt: function (time = 1) {
    this.taunted = Math.max(0, this.taunted || 0) + time
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
