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

        if (prop.distance < 0.5 && !prop.isTrain) {
          content.train.add(prop)
          continue
        }

        if (prop.distance < 0.5 && prop.isTrain) {
          content.train.remove(prop)
          continue
        }

        if (prop.isTrain) {
          continue
        }

        const nearest = quadtreeTrain.find(prop, radius)

        if (nearest) {
          content.train.remove(nearest)
          prop.invincible(1).run(1)
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
