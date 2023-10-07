app.screen.game.canvas = (() => {
  const maxCameraDistance = 37.5,
    minCameraDistance = 12.5

  const particleColors = [
    {r: 255, g: 174, b: 188},
    {r: 160, g: 231, b: 229},
    {r: 180, g: 248, b: 200},
    {r: 251, g: 231, b: 198},
  ]

  let cameraDistance,
    context,
    height,
    mToPx,
    particles = [],
    root,
    width

  engine.ready(() => {
    root = document.querySelector('.a-game--canvas')
    context = root.getContext('2d')

    window.addEventListener('resize', onResize)
    onResize()

    content.powerups.on('apply', onPowerupsApply)
    content.train.on('add', onTrainAdd)
    content.train.on('remove', onTrainRemove)

    app.state.screen.on('enter-game', onEnter)
    app.state.screen.on('exit-game', onExit)
  })

  function clear() {
    context.clearRect(0, 0, width, height)
  }

  function draw() {
    const isGameOver = !content.train.length()

    // Tracer effect
    if (!isGameOver) {
      context.fillStyle = 'rgba(0, 0, 0, 0.5)'
      context.fillRect(0, 0, width, height)
    }

    // Particles
    for (const particle of particles) {
      const radius = particle.radius * (1 - particle.life) * mToPx

      const x = (width / 2) - (particle.relative.y * mToPx),
        y = (height / 2) - (particle.relative.x * mToPx)

      context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.life})`
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }

    // Props
    for (const prop of engine.props.get()) {
      const alpha = prop.time < 1 ? prop.time : 1

      const color = prop.isTrain
        ? {h: 138, s: 83, l: 75}
        : {h: 350, s: 100, l: 75}

      color.l = engine.utility.lerp(color.l, 100, engine.utility.clamp(prop.stability, 0, 1))
      context.fillStyle = context.strokeStyle = `hsla(${color.h}deg, ${color.s}%, ${color.l}%, ${alpha})`

      const x = (width / 2) - (prop.relative.y * mToPx),
        y = (height / 2) - (prop.relative.x * mToPx)

      context.beginPath()
      context.arc(x, y, prop.radius * mToPx, 0, Math.PI * 2)

      if (prop.isTrain) {
        context.stroke()
      } else {
        context.fill()
      }

      if (prop.isPowerup && !isGameOver) {
        const fps = engine.performance.fps()

        if (Math.random() < 1/fps*8) {
          generateParticle(prop.vector())
        }
      }
    }

    // Player
    context.fillStyle = '#FFFFFF'
    context.beginPath()
    context.arc(width / 2, height / 2, 0.5 * mToPx, 0, Math.PI * 2)
    context.fill()
  }

  function generateParticle(vector) {
    const velocity = engine.utility.vector2d.unitX()
      .scale(engine.utility.random.float(1, 10))
      .rotate(Math.PI * engine.utility.random.float(-1, 1))

    particles.push({
      color: engine.utility.choose(particleColors, Math.random()),
      life: 1,
      radius: engine.utility.random.float(1/32, 1/8),
      rotate: Math.PI/8 * engine.utility.random.float(-1, 1),
      vector,
      velocity,
    })
  }

  function generateParticles(vector, count = 0) {
    for (let i = 0; i < count; i += 1) {
      generateParticle(vector)
    }
  }

  function onEnter() {
    resetCamera()
    clear()
    engine.loop.on('frame', onFrame)
  }

  function onExit() {
    engine.loop.off('frame', onFrame)
    particles = []
  }

  function onFrame() {
    if (!app.settings.computed.graphicsOn) {
      return
    }

    updateCamera()
    updateParticles()
    draw()
  }

  function onPowerupsApply() {
    generateParticles(engine.position.getVector(), 32)
  }

  function onResize() {
    height = root.height = root.clientHeight
    width = root.width = root.clientWidth
  }

  function onTrainAdd(prop) {
    const count = engine.utility.random.float(8, 24)
    generateParticles(prop.vector(), count)
  }

  function onTrainRemove(props) {
    for (const prop of props) {
      const count = engine.utility.random.float(8, 24)
      generateParticles(prop.vector(), count)
    }
  }

  function resetCamera() {
    cameraDistance = minCameraDistance
  }

  function updateCamera() {
    if (engine.loop.isPaused() && content.train.length()) {
      return
    }

    const enemies = content.spawner.enemiesByDistance()

    const target = enemies.length
      ? engine.utility.clamp(
          ((enemies[enemies.length - 1].distance + enemies[0].distance) * 0.5) + 1,
          minCameraDistance,
          maxCameraDistance,
        )
      : maxCameraDistance

    cameraDistance = content.utility.accelerateValue(
      cameraDistance,
      target,
      maxCameraDistance / 8
    )

    mToPx = height / 2 / cameraDistance
  }

  function updateParticles() {
    const delta = engine.loop.delta(),
      position = engine.position.getVector(),
      quaternion = engine.position.getQuaternion().conjugate()

    particles = particles.reduce((particles, particle) => {
      particle.life -= delta

      if (particle.life <= 0) {
        return particles
      }

      particle.vector = particle.vector.add(
        particle.velocity.scale(delta).rotate(particle.rotate)
      )

      particle.relative = position.subtract(particle.vector).inverse().rotateQuaternion(quaternion)

      particles.push(particle)

      return particles
    }, [])
  }

  return {
    debug: function (vector, radius = 8, style = '#FFFF00') {
      const position = engine.position.getVector(),
        quaternion = engine.position.getQuaternion().conjugate()

      const relative = position.subtract(vector).inverse().rotateQuaternion(quaternion)

      const x = (width / 2) - (relative.y * mToPx),
        y = (height / 2) - (relative.x * mToPx)

      context.strokeStyle = style
      context.strokeRect(x - radius, y - radius, radius * 2, radius * 2)

      return this
    },
  }
})()
