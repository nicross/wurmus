app.screen.gameOver = (() => {
  let restart,
    root

  engine.ready(() => {
    root = document.querySelector('.a-gameOver')

    restart = document.querySelector('.a-gameOver--restart')
    restart.addEventListener('click', onRestartClick)

    app.utility.focus.trap(root)

    app.state.screen.on('enter-gameOver', onEnter)
    app.state.screen.on('exit-gameOver', onExit)
  })

  function onEnter() {
    app.toolbar.attachTo(root)

    app.utility.focus.set(root)
    engine.loop.on('frame', onFrame)

    updateScores()
    engine.state.reset()
  }

  function onExit() {
    engine.loop.off('frame', onFrame)
  }

  function onFrame() {
    const ui = app.controls.ui()

    if (ui.start || (app.utility.focus.is(root) && (ui.confirm || ui.enter || ui.space))) {
      onRestartClick()
    }

    if (ui.confirm) {
      const focused = app.utility.focus.get(root)

      if (focused) {
        return focused.click()
      }
    }

    if (ui.cancel) {
      return app.quit()
    }

    if (ui.up || ui.left) {
      return app.utility.focus.setPreviousFocusable(root)
    }

    if (ui.down || ui.right) {
      return app.utility.focus.setNextFocusable(root)
    }
  }

  function onRestartClick() {
    app.state.screen.dispatch('restart')
  }

  function updateScores() {
    const highscore = app.storage.getHighscore(),
      score = Math.round(content.score.get())

    const isHighscore = score > highscore

    if (isHighscore) {
      app.storage.setHighscore(score)
    }

    root.querySelector('.a-gameOver--highscore').hidden = isHighscore
    root.querySelector('.a-gameOver--success').hidden = !isHighscore

    root.querySelector('.a-gameOver--scoreValue').innerHTML = app.utility.number.format(score)

    root.querySelector('.a-gameOver--highscoreValue').innerHTML = app.utility.number.format(
      app.storage.getHighscore()
    )
  }

  return {}
})()
