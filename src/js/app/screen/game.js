app.screen.game = (() => {
  let root

  engine.ready(() => {
    root = document.querySelector('.a-game')
    app.utility.focus.trap(root)

    app.state.screen.on('enter-game', onEnter)
    app.state.screen.on('exit-game', onExit)
  })

  function checkGameOver() {
    return !content.train.length()
  }

  function handleGameOver() {
    engine.loop.pause()
    app.state.screen.dispatch('gameOver')
  }

  function handleControls() {
    const game = app.controls.game()
    content.movement.update(game)
  }

  function onEnter() {
    app.utility.focus.set(root)
    engine.loop.on('frame', onFrame)

    engine.state.import({
      position: {
        x: 0,
        y: 0,
      },
    })

    engine.loop.resume()
  }

  function onExit() {
    engine.loop.off('frame', onFrame)
  }

  function onFrame({paused}) {
    if (paused) {
      return
    }

    if (checkGameOver()) {
      return handleGameOver()
    }

    handleControls()
  }

  return {}
})()
