app.screen.splash = (() => {
  let root,
    start

  engine.ready(() => {
    root = document.querySelector('.a-splash')

    start = root.querySelector('.a-splash--start')
    start.addEventListener('click', onStartClick)

    app.utility.focus.trap(root)

    app.state.screen.on('enter-splash', onEnter)
    app.state.screen.on('exit-splash', onExit)

    root.querySelector('.a-splash--version').innerHTML = `v${app.version()}`
  })

  function onEnter() {
    app.toolbar.attachTo(root)
    app.utility.focus.set(root)
    engine.loop.on('frame', onFrame)
    updateHighscore()
  }

  function onExit() {
    engine.loop.off('frame', onFrame)
  }

  function onFrame() {
    const ui = app.controls.ui()

    if (ui.start || (app.utility.focus.is(root) && (ui.confirm || ui.enter || ui.space))) {
      onStartClick()
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

  function onStartClick() {
    app.state.screen.dispatch('start')
  }

  function updateHighscore() {
    document.querySelector('.a-splash--highscore').hidden = !app.storage.hasHighscore()

    document.querySelector('.a-splash--highscoreValue').innerHTML = app.utility.number.format(
      app.storage.getHighscore()
    )
  }

  return {}
})()
