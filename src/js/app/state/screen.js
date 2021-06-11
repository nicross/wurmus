app.state.screen = engine.utility.machine.create({
  state: 'none',
  transition: {
    game: {
      gameOver: function () {
        this.change('gameOver')
      },
    },
    gameOver: {
      restart: function () {
        this.change('game')
      },
    },
    none: {
      ready: function () {
        this.change('splash')
      },
    },
    splash: {
      start: function () {
        if (app.storage.getHighscore() < 1000) {
          this.change('tutorial')
        } else {
          this.change('game')
        }
      },
    },
    tutorial: {
      start: function () {
        this.change('game')
      },
    },
  },
})

engine.ready(() => {
  [...document.querySelectorAll('.a-app--screen')].forEach((element) => {
    element.setAttribute('aria-hidden', 'true')
    element.setAttribute('role', 'persentation')
  })

  app.state.screen.dispatch('ready')
})

app.state.screen.on('exit', (e) => {
  const active = document.querySelector('.a-app--screen-active')
  const inactive = document.querySelector('.a-app--screen-inactive')

  if (active) {
    active.classList.remove('a-app--screen-active')
    active.classList.add('a-app--screen-inactive')
    active.setAttribute('aria-hidden', 'true')
    active.setAttribute('role', 'persentation')
  }

  if (inactive) {
    inactive.classList.remove('a-app--screen-inactive')
    inactive.hidden = true
  }

  engine.input.gamepad.reset()
  engine.input.keyboard.reset()
  engine.input.mouse.reset()
})

app.state.screen.on('enter', (e) => {
  const selectors = {
    game: '.a-app--game',
    gameOver: '.a-app--gameOver',
    splash: '.a-app--splash',
    tutorial: '.a-app--tutorial',
  }

  const selector = selectors[e.currentState]
  const element = document.querySelector(selector)

  element.classList.add('a-app--screen-active')
  element.removeAttribute('aria-hidden')
  element.removeAttribute('role')
  element.removeAttribute('hidden')
})
