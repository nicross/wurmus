content.powerups.taunt = content.powerups.register({
  key: 'taunt',
  weight: 2,
  apply: function () {
    const props = engine.props.get()

    for (const prop of props) {
      if (!prop.isTrain) {
        prop.taunt(3)
      }
    }

    this.sfx()

    return this
  },
  sfx: () => {
    const bus = content.sfx.bus

    // TODO: synth
  },
})
