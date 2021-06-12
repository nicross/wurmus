content.sfx = {}

content.sfx.bus = engine.audio.mixer.createBus()
content.sfx.bus.gain.value = engine.utility.fromDb(0)

content.sfx.footstep = function ({
  color = 0.5,
  destination = content.sfx.bus,
  frequency = 440,
  velocity = 1,
} = {}) {
  const synth = engine.audio.synth.createSimple({
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

  synth.stop(now + duration)
}
