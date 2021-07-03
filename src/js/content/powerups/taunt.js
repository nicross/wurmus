content.powerups.taunt = content.powerups.register({
  key: 'taunt',
  duration: 5,
  weight: 2,
  apply: function () {
    const props = engine.props.get()

    for (const prop of props) {
      if (!prop.isTrain) {
        prop.taunt(this.duration)
      }
    }

    this.sfx()

    return this
  },
  sfx: function () {
    const frequency = engine.utility.midiToFrequency(48),
      now = engine.audio.time()

    const synth = engine.audio.synth.createMod({
      amodDepth: 1/3,
      amodFrequency: frequency * 2,
      amodType: 'square',
      carrierDetune: 0,
      carrierFrequency: frequency,
      carrierGain: 2/3,
      carrierType: 'triangle',
      fmodDetune: 0,
      fmodDepth: frequency,
      fmodFrequency: 8,
      fmodType: 'sawtooth',
    }).filtered({
      detune: 0,
      frequency,
    }).connect(content.powerups.bus())

    synth.filter.detune.linearRampToValueAtTime(2400, now + this.duration)
    synth.param.detune.linearRampToValueAtTime(-1200, now + this.duration)
    synth.param.amod.detune.linearRampToValueAtTime(2400, now + this.duration)
    synth.param.fmod.frequency.linearRampToValueAtTime(1/8, now + this.duration)

    synth.param.gain.setValueAtTime(engine.const.zeroGain, now)
    synth.param.gain.exponentialRampToValueAtTime(1/4, now + 1/32)
    synth.param.gain.exponentialRampToValueAtTime(1/16, now + 1/4)
    synth.param.gain.linearRampToValueAtTime(engine.const.zeroGain, now + this.duration)

    synth.stop(now + this.duration)

    return this
  },
})
