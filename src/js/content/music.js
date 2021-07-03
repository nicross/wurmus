content.music = (() => {
  const bus = engine.audio.mixer.createBus(),
    reverb = engine.audio.mixer.send.reverb.create()

  let centerLfoDetune,
    centerLfoFilter,
    centerPhaser,
    centerSynth,
    isActive,
    leftBinaural,
    leftLfo,
    leftSynth,
    kickSynth,
    rightBinaural,
    rightLfo,
    rightSynth,
    subSynth

  bus.gain.value = engine.const.zeroGain
  reverb.from(bus)

  function createSynths() {
    destroySynths()

    centerSynth = engine.audio.synth.createSimple({
      detune: engine.utility.random.float(-5, 5),
      frequency: engine.utility.midiToFrequency(68),
      gain: engine.utility.fromDb(-9),
      type: 'sawtooth',
    }).filtered({
      frequency: engine.utility.midiToFrequency(68) * 2,
    }).chainAssign('phaser', engine.audio.effect.createPhaser({
      depth: 0.005,
      dry: 0,
      feedback: 0.5,
      frequency: 1/8,
      wet: 1,
    })).connect(bus)

    centerLfoDetune = engine.audio.synth.createLfo({
      depth: -100,
      frequency: 1/12,
    }).shaped(
      engine.audio.shape.distort()
    ).connect(centerSynth.param.detune)

    centerLfoFilter = engine.audio.synth.createLfo({
      depth: engine.utility.midiToFrequency(68) * 1,
      frequency: 1/70,
    }).connect(centerSynth.filter.frequency)

    kickSynth = engine.audio.synth.createAm({
      carrierFrequency: engine.utility.midiToFrequency(36),
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
      gain: 2/3,
      modDepth: 1/4,
      modFrequency: 3,
      modType: 'triangle',
    }).filtered({
      frequency: engine.utility.midiToFrequency(60) * 2,
    })

    leftLfo = engine.audio.synth.createLfo({
      depth: 1/3,
      frequency: 1/30,
    }).connect(leftSynth.param.gain)

    leftBinaural = engine.audio.binaural.create({
      x: 0.5,
      y: 0.5,
    }).from(leftSynth).to(bus)

    rightSynth = engine.audio.synth.createAm({
      carrierDetune: engine.utility.random.float(-5, 5),
      carrierFrequency: engine.utility.midiToFrequency(60),
      carrierGain: 3/4,
      carrierType: 'sawtooth',
      gain: 2/3,
      modDepth: 1/4,
      modFrequency: 4,
      modType: 'triangle',
    }).filtered({
      frequency: engine.utility.midiToFrequency(60) * 2,
    })

    rightLfo = engine.audio.synth.createLfo({
      depth: 1/3,
      frequency: 1/40,
    }).connect(rightSynth.param.gain)

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
    if (centerLfoDetune) {
      centerLfoDetune.stop()
      centerLfoDetune = undefined
    }

    if (centerLfoFilter) {
      centerLfoFilter.stop()
      centerLfoFilter = undefined
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

    if (leftLfo) {
      leftLfo.stop()
      leftLfo = undefined
    }

    if (leftSynth) {
      leftSynth.stop()
      leftSynth = undefined
    }

    if (rightBinaural) {
      rightBinaural.destroy()
      rightBinaural = undefined
    }

    if (rightLfo) {
      rightLfo.stop()
      rightLfo = undefined
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

  function start() {
    const attack = 4

    createSynths()
    engine.audio.ramp.linear(bus.gain, engine.utility.fromDb(-15), attack)
  }

  function stop() {
    const release = 1

    engine.audio.ramp.exponential(bus.gain, engine.const.zeroGain, release)
    setTimeout(destroySynths, release * 1000)
  }

  return {
    onPause: function () {
      if (isActive) {
        start()
      }

      return this
    },
    onResume: function () {
      if (isActive) {
        stop()
      }
      
      return this
    },
    setActive: function (value) {
      isActive = value

      if (engine.loop.isPaused()) {
        if (isActive) {
          start()
        } else {
          stop()
        }
      }

      return this
    },
  }
})()

engine.loop.on('pause', () => content.music.onPause())
engine.loop.on('resume', () => content.music.onResume())
