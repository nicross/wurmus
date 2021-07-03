app.screen.tutorial = (() => {
  let root,
    start

  engine.ready(() => {
    root = document.querySelector('.a-tutorial')

    start = root.querySelector('.a-tutorial--start')
    start.addEventListener('click', onStartClick)

    app.utility.focus.trap(root)

    app.state.screen.on('enter-tutorial', onEnter)
    app.state.screen.on('exit-tutorial', onExit)
  })

  function onEnter() {
    app.toolbar.attachTo(root)
    app.utility.focus.set(root)
    engine.loop.on('frame', onFrame)
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

  return {}
})()
