content.collisions = (() => {

  return {
    update: function () {
      const props = engine.props.get()

      const quadtreeTrain = content.train.quadtree(),
        radius = content.prop.actor.radius

      for (const prop of props) {
        if (prop.invincibility) {
          continue
        }

        if (!engine.utility.round(prop.distance, 1)) {
          if (prop.isTrain) {
            content.train.remove(prop)
          } else {
            content.train.add(prop)
          }
          continue
        }

        if (prop.isTrain) {
          continue
        }

        const nearest = quadtreeTrain.find(prop, radius)

        if (nearest) {
          content.train.remove(nearest)
          prop.run()
        }
      }

      return this
    },
  }
})()

engine.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  content.collisions.update()
})