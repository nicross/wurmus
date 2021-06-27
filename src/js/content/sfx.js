content.sfx = {}

content.sfx.bus = engine.audio.mixer.createBus()
content.sfx.bus.gain.value = engine.utility.fromDb(0)

content.sfx.createNote = function ({
  frequency,
  gain = engine.utility.fromDb(-12),
  off,
  when,
} = {}) {
  const synth = engine.audio.synth.createSimple({
    detune: engine.utility.random.float(-10, 10),
    frequency,
    type: 'square',
    when,
  }).filtered({
    frequency: frequency * 4,
  }).connect(this.bus)

  synth.param.gain.setValueAtTime(engine.const.zeroGain, when)
  synth.param.gain.exponentialRampToValueAtTime(gain, when + 1/32)
  synth.param.gain.exponentialRampToValueAtTime(gain/16, off)
  synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, off + 1/2)

  synth.param.detune.linearRampToValueAtTime(1200, off)

  synth.stop(off + 1/2)

  return synth
}

content.sfx.footstep = function ({
  color = 0.5,
  destination = content.sfx.bus,
  frequency = 440,
  velocity = 1,
} = {}) {
  const synth = engine.audio.synth.createSimple({
    detune: engine.utility.random.float(-10, 10),
    frequency,
    type: 'square',
  }).filtered({
    frequency: frequency * color * engine.utility.lerp(0.5, 2, velocity),
  }).connect(destination)

  const duration = 0.5,
    gain = engine.utility.fromDb(engine.utility.lerp(-12, -6, velocity)),
    now = engine.audio.time()

  synth.param.gain.exponentialRampToValueAtTime(gain, now + 1/32)
  synth.param.gain.exponentialRampToValueAtTime(engine.const.zeroGain, now + duration)

  synth.param.detune.linearRampToValueAtTime(1200, now + duration/2)

  synth.stop(now + duration)

  return this
}

content.sfx.gameOver = function () {
  const frequency = engine.utility.midiToFrequency(36)

  const synth = engine.audio.synth.createSimple({
    detune: 1200 + engine.utility.random.float(-10, 10),
    frequency,
    type: 'square',
  }).filtered({
    frequency: frequency,
  }).connect(this.bus)

  const duration = 2,
    gain = engine.utility.fromDb(-9),
    now = engine.audio.time()

  synth.param.gain.exponentialRampToValueAtTime(gain, now + 1/32)
  synth.param.gain.exponentialRampToValueAtTime(gain/16, now + duration/4)
  synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, now + duration)

  synth.param.detune.linearRampToValueAtTime(0, now + duration/4)
  synth.param.detune.linearRampToValueAtTime(-1200, now + duration)

  synth.filter.frequency.exponentialRampToValueAtTime(frequency * 8, now + duration)

  synth.stop(now + duration)

  return this
}

content.sfx.spawn = function (prop) {
  const frequency = prop.frequency

  const synth = engine.audio.synth.createSimple({
    detune: engine.utility.random.float(-10, 10),
    frequency,
    type: 'sawtooth',
  }).filtered({
    frequency: frequency * 2,
    type: 'highpass',
  })

  const binaural = engine.audio.binaural.create(
    prop.relative.normalize()
  ).from(synth).to(this.bus)

  const duration = 1,
    gain = engine.utility.fromDb(-9),
    now = engine.audio.time()

  synth.param.gain.exponentialRampToValueAtTime(gain, now + 1/32)
  synth.param.gain.exponentialRampToValueAtTime(gain/16, now + duration/4)
  synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, now + duration)

  synth.param.detune.linearRampToValueAtTime(1200, now + duration/4)

  synth.filter.frequency.exponentialRampToValueAtTime(engine.const.maxFrequency, now + duration)

  synth.stop(now + duration)

  engine.loop.on('frame', function update() {
    if (engine.audio.time() > now + duration) {
      return engine.loop.off('frame', update)
    }

    binaural.update(prop.relative.normalize())
  })

  return this
}

content.sfx.trainAdd = function () {
  const now = engine.audio.time()

  this.createNote({
    frequency: engine.utility.midiToFrequency(60),
    when: now + 0.0625,
    off: now + 0.125,
  })

  this.createNote({
    frequency: engine.utility.midiToFrequency(64),
    when: now + 0.125,
    off: now + 0.1875,
  })

  this.createNote({
    frequency: engine.utility.midiToFrequency(67),
    when: now + 0.1875,
    off: now + 0.25,
  })

  this.createNote({
    frequency: engine.utility.midiToFrequency(72),
    when: now + 0.25,
    off: now + 0.3125,
  })

  return this
}

content.sfx.trainRemove = function () {
  const now = engine.audio.time()

  this.createNote({
    frequency: engine.utility.midiToFrequency(64),
    when: now + 0.0625,
    off: now + 0.125,
  })

  this.createNote({
    frequency: engine.utility.midiToFrequency(60),
    when: now + 0.125,
    off: now + 0.1875,
  })

  this.createNote({
    frequency: engine.utility.midiToFrequency(57),
    when: now + 0.1875,
    off: now + 0.25,
  })

  this.createNote({
    frequency: engine.utility.midiToFrequency(52),
    when: now + 0.25,
    off: now + 0.3125,
  })

  return this
}

engine.ready(() => {
  content.spawner.on('spawn', (prop) => content.sfx.spawn(prop))
  content.train.on('add', () => content.sfx.trainAdd())
  content.train.on('remove', (props) => content.sfx.trainRemove(props.length))
})
