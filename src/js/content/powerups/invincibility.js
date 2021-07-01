content.powerups.invincibility = content.powerups.register({
  key: 'invincibility',
  apply: function () {
    const props = engine.props.get()

    for (const props of prop) {
      if (prop.isTrain) {
        prop.invincible(3)
      }
    }

    return this
  },
})
