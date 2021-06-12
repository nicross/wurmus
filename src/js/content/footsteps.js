content.footsteps = (() => {
  const bus = engine.audio.mixer.createBus()

  const footstepper = content.utility.footstepper.create({
    parameters: {
      color: 1/4,
      destination: bus,
      frequency: engine.utility.midiToFrequency(60),
    },
  })

  return {
    import: function () {
      footstepper.reset({
        position: engine.position.getVector(),
      })

      return this
    },
    update: function () {
      footstepper.update({
        position: engine.position.getVector(),
      })

      return this
    },
  }
})()

engine.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  content.footsteps.update()
})

engine.state.on('import', () => content.footsteps.import())
