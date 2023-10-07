app.screen.game.paused = (() => {
  const pausedText = document.createElement('div')
  pausedText.classList.add('a-game--pausedText')
  pausedText.innerHTML = 'Game Paused'

  const resumedText = document.createElement('div')
  resumedText.classList.add('u-screenReader')
  resumedText.innerHTML = 'Game Resumed'

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
      root.innerHTML = ''
      root.ontransitionend = undefined

      root.appendChild(pausedText)

      window.requestAnimationFrame(() => {
        root.classList.add('a-game--paused-active')
      })
    },
    deactivate: function () {
      root.appendChild(resumedText)
      root.classList.remove('a-game--paused-active')

      root.ontransitionend = () => {
        root.innerHTML = ''
        root.ontransitionend = undefined
      }
    },
  }
})()
