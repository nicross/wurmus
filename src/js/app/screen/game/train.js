app.screen.game.train = (() => {
  let root,
    value

  engine.ready(() => {
    root = document.querySelector('.a-game--train')
    app.state.screen.on('enter-game', onEnter)
    app.state.screen.on('exit-game', onExit)
  })

  function onEnter() {
    value = 1
    root.innerHTML = value
    root.setAttribute('aria-live', 'assertive')
    root.removeAttribute('aria-hidden')
    engine.loop.on('frame', onFrame)
  }

  function onExit() {
    root.setAttribute('aria-hidden', 'true')
    root.removeAttribute('aria-live')
    engine.loop.off('frame', onFrame)
  }

  function onFrame({paused}) {
    if (paused) {
      return
    }

    update()
  }

  function update() {
    const length = content.train.length()

    if (length == value) {
      return
    }

    value = length

    // Mute on zero
    if (value == 0) {
      root.setAttribute('aria-hidden', 'true')
      root.removeAttribute('aria-live')
      window.requestAnimationFrame(() => root.innerHTML = value)
    } else {
      root.innerHTML = value
    }
  }

  return {}
})()
