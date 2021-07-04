app.screen.game.train = (() => {
  let root,
    value

  engine.ready(() => {
    root = document.querySelector('.a-game--train')
    app.state.screen.on('enter-game', onEnter)
    app.state.screen.on('exit-game', onExit)
  })

  function onEnter() {
    root.innerHTML = ''
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
    if (paused || !app.settings.computed.graphicsOn) {
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
    root.innerHTML = value || ''
  }

  return {}
})()
