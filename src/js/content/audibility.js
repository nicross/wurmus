/**
 * Handles the audibility of props' main synths.
 * Props are possibly audible if facing towards them.
 * They are prioritized by distance (closest) up to a limit.
 * Enemeis and allies are interleaved to ensure that at least some of each are audible when possible.
 * This does not affect footsteps or power-up sounds.
 */
content.audibility = (() => {
  const maxAudible = 8

  const audible = new Set(),
    possible = new Set()

  function updateAudible() {
    audible.clear()

    const allies = content.spawner.alliesByDistance().filter((prop) => possible.has(prop)),
      enemies = content.spawner.enemiesByDistance().filter((prop) => possible.has(prop))

    do {
      // Grab next closest enemy, if one is possible
      const enemy = enemies.shift()

      if (enemy) {
        audible.add(enemy)
      }

      if (audible.size == maxAudible) {
        break
      }

      // Grab next closest ally, if one is possible
      const ally = allies.shift()

      if (ally) {
        audible.add(ally)
      }
    } while (audible.size < maxAudible && (allies.length || enemies.length))
  }

  function updatePossible() {
    possible.clear()

    for (const prop of engine.props.get()) {
      // Must be ahead
      if (prop.relative.x >= 0) {
        possible.add(prop)
      }
    }
  }

  function updateProps() {
    for (const prop of engine.props.get()) {
      prop.setAudibility(
        audible.has(prop)
      )
    }
  }

  return {
    audible: () => audible,
    possible: () => possible,
    reset: function () {
      audible.clear()
      possible.clear()

      return this
    },
    update: function () {
      updatePossible()
      updateAudible()
      updateProps()

      return this
    },
  }
})()

// Allow props and train to update first.
// This means that audibility lags behind a frame, but should not be too problematic.
engine.ready(() => {
  engine.loop.on('frame', ({paused}) => {
    if (paused) {
      return
    }

    content.audibility.update()
  })
})

engine.state.on('reset', () => content.audibility.reset())
