content.prop.actor = engine.prop.base.invent({
  name: 'actor',
  onConstruct: function () {
    this.footstepper = content.utility.footstepper.create({
      parameters: {
        destination: this.input,
      },
      position: this.vector(),
    })
  },
  onDestroy: function () {

  },
  onUpdate: function () {
    this.move()

    this.footstepper.update({
      position: this.vector(),
    })
  },
  move: function () {

  },
})
