content.music = (() => {
  const bus = engine.audio.mixer.createBus()

  let leftBinaural,
    leftSynth,
    rightBinaural,
    rightSynth,
    subSynth

  bus.gain.value = engine.const.zeroGain

  function createSynths() {
    leftBinaural = engine.audio.binaural.create({
      x: 0.5,
      y: 0.5,
    })

    rightBinaural = engine.audio.binaural.create({
      x: 0.5,
      y: -0.5,
    })
  }

  function destroySynths() {
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
      const attack = 2

      createSynths()
      engine.audio.ramp.linear(bus.gain, engine.utility.fromDb(-18), attack)

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
