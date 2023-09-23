app.screen.game.paused = (() => {
  let root,
    text

  engine.ready(() => {
    root = document.querySelector('.a-game--paused')

    app.state.screen.on('enter-game', onEnter)
    app.state.screen.on('exit-game', onExit)
  })

  function onEnter() {
    root.setAttribute('aria-live', 'assertive')
    root.removeAttribute('aria-hidden')
  }

  function onExit() {
    root.setAttribute('aria-hidden', 'true')
    root.removeAttribute('aria-live')
  }

  return {
    activate: function () {
      root.classList.add('a-game--paused-active')
      root.innerHTML = `<div class="a-game--pausedText">Game Paused</div>`
    },
    deactivate: function () {
      root.classList.remove('a-game--paused-active')

      root.innerHTML = `
        <div class="a-game--pausedText" aria-hidden="true">Game Paused</div>
        <div class="a-game--pausedText u-screenReader">Game Resumed</div>
      `
    },
  }
})()
