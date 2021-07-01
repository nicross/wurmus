content.powerups.taunt = content.powerups.register({
  key: 'taunt',
  apply: function () {
    const props = engine.props.get()

    for (const props of prop) {
      if (!prop.isTrain) {
        prop.taunt(3)
      }
    }

    return this
  },
})
