content.lfos = (() => {
  const count = 3,
    lfos = []

  return {
    choose: () => engine.utility.choose(lfos, Math.random()),
    lfos: () => [...lfos],
    reset: function () {
      for (const lfo of lfos) {
        lfo.stop()
      }

      for (let i = 0; i < count; i += 1) {
        lfos.push(
          engine.audio.synth.createLfo({
            depth: 0.5,
            frequency: engine.utility.random.float(7, 9),
          })
        )
      }

      return this
    },
  }
})()

engine.state.on('reset', () => content.lfos.reset())
