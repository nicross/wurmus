content.powerups.fear = content.powerups.register({
  key: 'fear',
  weight: 2,
  apply: function () {
    const props = engine.props.get()

    for (const prop of props) {
      if (!prop.isTrain) {
        prop.run(3)
      }
    }

    return this
  },
})
