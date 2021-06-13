app.screen.game.canvas = (() => {
  let context,
    height,
    mToPx,
    root,
    width

  engine.ready(() => {
    root = document.querySelector('.a-game--canvas')
    context = root.getContext('2d')

    window.addEventListener('resize', onResize)
    onResize()

    app.state.screen.on('enter-game', onEnter)
    app.state.screen.on('exit-game', onExit)

    engine.state.on('reset', onReset)
  })

  function clear() {
    context.clearRect(0, 0, width, height)
  }

  function draw() {
    // Tracer effect
    context.fillStyle = 'rgba(0, 0, 0, 0.5)'
    context.fillRect(0, 0, width, height)

    // Props
    for (const prop of engine.props.get()) {
      context.fillStyle = context.strokeStyle = prop.isTrain
        ? '#B4F8C8'
        : '#FFAEBC'

      const x = (width / 2) - (prop.relative.y * mToPx),
        y = (height / 2) - (prop.relative.x * mToPx)

      context.beginPath()
      context.arc(x, y, prop.radius * mToPx, 0, Math.PI * 2)

      if (prop.isTrain) {
        context.stroke()
      } else {
        context.fill()
      }
    }

    // Player
    context.fillStyle = '#FFFFFF'
    context.beginPath()
    context.arc(width / 2, height / 2, 0.5 * mToPx, 0, Math.PI * 2)
    context.fill()
  }

  function onEnter() {
    engine.loop.on('frame', onFrame)
  }

  function onExit() {
    engine.loop.off('frame', onFrame)
  }

  function onReset() {
    clear()
  }

  function onResize() {
    height = root.height = root.clientHeight
    width = root.width = root.clientWidth
    mToPx = height / 100
  }

  function onFrame({paused}) {
    if (paused) {
      return
    }

    draw()
  }

  return {}
})()
