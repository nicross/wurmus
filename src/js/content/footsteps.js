content.footsteps = (() => {
  const bus = engine.audio.mixer.createBus()

  const footstepper = content.utility.footstepper.create({
    parameters: {
      color: 1/8,
      destination: bus,
      frequency: engine.utility.midiToFrequency(72),
    },
  })

  return engine.utility.pubsub.decorate({
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
  }, footstepper.pubsub)
})()

engine.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  content.footsteps.update()
})

engine.state.on('import', () => content.footsteps.import())
