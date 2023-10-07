content.powerups.stability = content.powerups.register({
  key: 'stability',
  name: 'Stability',
  duration: 5,
  weight: 3,
  lastApplication: 0,
  apply: function () {
    const props = engine.props.get()

    for (const prop of props) {
      if (prop.isTrain) {
        prop.stable(this.duration)
      }
    }

    this.sfx()

    this.lastApplication = engine.audio.time()

    return this
  },
  sfx: function () {
    const frequency = engine.utility.midiToFrequency(48),
      now = engine.audio.time()

    const synth = engine.audio.synth.createMod({
      amodDepth: 1/4,
      amodFrequency: 8,
      carrierDetune: 0,
      carrierFrequency: frequency,
      carrierGain: 3/4,
      fmodDetune: engine.utility.random.float(-25, 25),
      fmodDepth: frequency,
      fmodFrequency: frequency * 2,
      fmodType: 'triangle',
    }).filtered({
      detune: 0,
      frequency,
    }).connect(content.powerups.bus())

    synth.filter.detune.linearRampToValueAtTime(2400, now + this.duration)
    synth.param.detune.linearRampToValueAtTime(9600, now + this.duration)

    synth.param.gain.setValueAtTime(engine.const.zeroGain, now)
    synth.param.gain.exponentialRampToValueAtTime(1/4, now + 1/32)
    synth.param.gain.exponentialRampToValueAtTime(1/16, now + 1/4)
    synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, now + this.duration)

    synth.stop(now + this.duration)

    return this
  },
})
