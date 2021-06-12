content.sfx = {}

content.sfx.bus = engine.audio.mixer.createBus()
content.sfx.bus.gain.value = engine.utility.fromDb(0)

content.sfx.createNote = function ({
  frequency,
  gain = engine.utility.fromDb(-18),
  off,
  when,
} = {}) {
  const synth = engine.audio.synth.createSimple({
    frequency,
    type: 'square',
    when,
  }).filtered({
    frequency: frequency * 4,
  }).connect(this.bus)

  synth.param.gain.setValueAtTime(engine.const.zeroGain, when)
  synth.param.gain.exponentialRampToValueAtTime(gain, when + 1/32)
  synth.param.gain.linearRampToValueAtTime(gain/4, off)
  synth.param.gain.exponentialRampToValueAtTime(engine.const.zeroGain, off + 1/2)

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
    frequency: engine.utility.midiToFrequency(56),
    when: now + 0.1875,
    off: now + 0.25,
  })

  return this
}

engine.ready(() => {
  content.train.on('add', () => content.sfx.trainAdd())
  content.train.on('remove', (props) => content.sfx.trainRemove(props.length))
})
