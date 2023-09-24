content.powerups.fear = content.powerups.register({
  key: 'fear',
  name: 'Fear',
  duration: 5,
  weight: 2,
  apply: function () {
    const props = engine.props.get()

    for (const prop of props) {
      if (!prop.isTrain) {
        prop.run(this.duration)
      }
    }

    this.sfx()

    return this
  },
  sfx: function () {
    const frequency = engine.utility.midiToFrequency(48),
      now = engine.audio.time()

    const synth = engine.audio.synth.createMod({
      amodDetune: 0,
      amodDepth: 1/3,
      amodFrequency: 12,
      carrierDetune: -1200,
      carrierFrequency: frequency,
      carrierGain: 2/3,
      fmodDetune: engine.utility.random.float(-25, 25),
      fmodDepth: frequency * 8,
      fmodFrequency: engine.utility.addInterval(frequency, 30/12),
      fmodType: 'sawtooth',
    }).filtered({
      frequency: frequency,
    }).connect(content.powerups.bus())

    synth.filter.detune.linearRampToValueAtTime(12000, now + this.duration)
    synth.param.detune.linearRampToValueAtTime(-600, now + this.duration)
    synth.param.amod.detune.linearRampToValueAtTime(-1200, now + this.duration)
    synth.param.fmod.depth.linearRampToValueAtTime(frequency, now + this.duration)
    synth.param.fmod.detune.linearRampToValueAtTime(-150, now + this.duration)

    synth.param.gain.setValueAtTime(engine.const.zeroGain, now)
    synth.param.gain.exponentialRampToValueAtTime(1/4, now + 1/32)
    synth.param.gain.exponentialRampToValueAtTime(1/16, now + 1/4)
    synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, now + this.duration)

    synth.stop(now + this.duration)

    return this
  },
})
