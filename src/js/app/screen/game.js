app.screen.game = (() => {
  let root

  engine.ready(() => {
    root = document.querySelector('.a-game')
    app.utility.focus.trap(root)

    app.screen.game.toasts.ready()

    app.state.screen.on('enter-game', onEnter)
    app.state.screen.on('exit-game', onExit)
  })

  function checkGameOver() {
    return !content.train.length()
  }

  function handleGameOver() {
    engine.loop.pause()
    content.spawner.duck()
    content.sfx.gameOver()

    setTimeout(() => app.state.screen.dispatch('gameOver'), 1000)
  }

  function onEnter() {
    if (app.settings.computed.graphicsOn) {
      root.classList.remove('a-game-graphicsOff')
    } else {
      root.classList.add('a-game-graphicsOff')
    }

    app.utility.focus.set(root)
    engine.loop.on('frame', onFrame)

    engine.state.import({
      position: {
        x: 0,
        y: 0,
      },
    })

    content.music.stop()
    content.spawner.unduck()

    app.screen.game.toasts.enter()

    engine.loop.resume()

    if (app.isElectron()) {
      app.controls.mouse.requestPointerLock()
    }
  }

  function onExit() {
    engine.loop.off('frame', onFrame)
    content.music.start()
    app.screen.game.toasts.exit()
  }

  function onFrame({paused}) {
    const game = app.controls.game(),
      ui = app.controls.ui()

    if (paused && (ui.confirm || ui.pause)) {
      app.screen.game.paused.deactivate()
      engine.loop.resume()
      paused = false
    } else if (!paused && (ui.cancel || ui.pause || ui.isPointerLockExit || !document.hasFocus())) {
      app.screen.game.paused.activate()
      engine.loop.pause()
      paused = true
    }

    if (paused) {
      return
    }

    content.movement.update(game)
    app.screen.game.toasts.update()

    if (checkGameOver()) {
      handleGameOver()
    }
  }

  return {}
})()
