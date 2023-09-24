content.collisions = (() => {

  return {
    update: function () {
      const props = engine.props.get()

      const quadtreeTrain = content.train.quadtreeFriendly(),
        radius = content.prop.actor.radius

      for (const prop of props) {
        if (prop.stability) {
          continue
        }

        if (prop.distance < 0.5 && !prop.isTrain) {
          content.train.add(prop)
          continue
        }

        if (prop.distance < 0.5 && prop.isTrain && content.train.indexOf(prop) > 0) {
          content.train.remove(prop)
          continue
        }

        if (prop.isTrain) {
          continue
        }

        const nearest = quadtreeTrain.find(prop, radius)

        if (nearest && !nearest.stability) {
          content.train.remove(nearest)
          prop.stable(1).run(1)
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
