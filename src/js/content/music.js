content.music = (() => {
  const bus = engine.audio.mixer.createBus(),
    reverb = engine.audio.mixer.send.reverb.create()

  let centerLfo,
    centerPhaser,
    centerSynth,
    leftBinaural,
    leftSynth,
    kickSynth,
    rightBinaural,
    rightSynth,
    subSynth

  bus.gain.value = engine.const.zeroGain
  reverb.from(bus)

  function createSynths() {
    centerSynth = engine.audio.synth.createSimple({
      detune: engine.utility.random.float(-5, 5),
      frequency: engine.utility.midiToFrequency(68),
      gain: engine.utility.fromDb(-6),
      type: 'sawtooth',
    }).filtered({
      frequency: engine.utility.midiToFrequency(68),
    }).chainAssign('phaser', engine.audio.effect.createPhaser({
      depth: 0.005,
      dry: 0,
      feedback: 0.825,
      frequency: 1/8,
      wet: 1,
    })).connect(bus)

    centerLfo = engine.audio.synth.createLfo({
      depth: -100,
      frequency: 1/12,
    }).shaped(
      engine.audio.shape.distort()
    ).connect(centerSynth.param.detune)

    kickSynth = engine.audio.synth.createAm({
      carrierFrequency: engine.utility.midiToFrequency(24),
      carrierGain: 0,
      carrierType: 'sawtooth',
      gain: engine.utility.fromDb(-3),
      modDepth: 1,
      modFrequency: 1,
      modType: 'sawtooth',
    }).filtered({
      frequency: engine.utility.midiToFrequency(24) * 4,
    }).connect(bus)

    leftSynth = engine.audio.synth.createAm({
      carrierDetune: engine.utility.random.float(-5, 5),
      carrierFrequency: engine.utility.midiToFrequency(52),
      carrierGain: 3/4,
      carrierType: 'sawtooth',
      gain: engine.utility.fromDb(-3),
      modDepth: 1/4,
      modFrequency: 3,
      modType: 'triangle',
    }).filtered({
      frequency: engine.utility.midiToFrequency(60) * 2,
    })

    leftBinaural = engine.audio.binaural.create({
      x: 0.5,
      y: 0.5,
    }).from(leftSynth).to(bus)

    rightSynth = engine.audio.synth.createAm({
      carrierDetune: engine.utility.random.float(-5, 5),
      carrierFrequency: engine.utility.midiToFrequency(60),
      carrierGain: 3/4,
      carrierType: 'sawtooth',
      gain: engine.utility.fromDb(-3),
      modDepth: 1/4,
      modFrequency: 4,
      modType: 'triangle',
    }).filtered({
      frequency: engine.utility.midiToFrequency(60) * 2,
    })

    rightBinaural = engine.audio.binaural.create({
      x: 0.5,
      y: -0.5,
    }).from(rightSynth).to(bus)

    subSynth = engine.audio.synth.createSimple({
      frequency: engine.utility.midiToFrequency(24),
      gain: 1,
      type: 'sine',
    }).connect(bus)
  }

  function destroySynths() {
    if (centerLfo) {
      centerLfo.stop()
      centerLfo = undefined
    }

    if (centerPhaser) {
      centerPhaser.stop()
      centerPhaser = undefined
    }

    if (centerSynth) {
      centerSynth.stop()
      centerSynth = undefined
    }

    if (kickSynth) {
      kickSynth.stop()
      kickSynth = undefined
    }

    if (leftBinaural) {
      leftBinaural.destroy()
      leftBinaural = undefined
    }

    if (leftSynth) {
      leftSynth.stop()
      leftSynth = undefined
    }

    if (rightBinaural) {
      rightBinaural.destroy()
      rightBinaural = undefined
    }

    if (rightSynth) {
      rightSynth.stop()
      rightSynth = undefined
    }

    if (subSynth) {
      subSynth.stop()
      subSynth = undefined
    }
  }

  return {
    start: function () {
      const attack = 4

      createSynths()
      engine.audio.ramp.linear(bus.gain, engine.utility.fromDb(-15), attack)

      return this
    },
    stop: function () {
      const release = 1

      engine.audio.ramp.exponential(bus.gain, engine.const.zeroGain, release)
      setTimeout(destroySynths, release * 1000)

      return this
    },
  }
})()

engine.loop.on('pause', () => content.music.start())
engine.loop.on('resume', () => content.music.stop())
