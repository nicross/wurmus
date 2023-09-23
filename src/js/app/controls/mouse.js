app.controls.mouse = (() => {
  const sensitivity = 100

  let gameScreen,
    isPointerLocked = false,
    rotate = 0

  // XXX: syngen hack
  let previousMoveX = 0

  engine.ready(() => {
    gameScreen = document.querySelector('.a-game')
    gameScreen.addEventListener('click', onClick)

    app.state.screen.on('exit-game', onExitGame)
  })

  function exitPointerLock() {
    if (!isPointerLock()) {
      return
    }

    document.exitPointerLock()
    isPointerLocked = false
  }

  function isPointerLock() {
    return document.pointerLockElement === gameScreen
  }

  function onClick() {
    if (engine.loop.isPaused()) {
      return
    }

    requestPointerLock()
  }

  function onExitGame() {
    exitPointerLock()

    rotate = 0

    // XXX: syngen hack
    engine.input.mouse.reset()
    previousMoveX = 0
  }

  function requestPointerLock() {
    if (isPointerLock()) {
      return
    }

    gameScreen.requestPointerLock()
  }

  return {
    exitPointerLock: function () {
      exitPointerLock()
      return this
    },
    isPointerLock,
    game: function () {
      if (!isPointerLock()) {
        return {}
      }

      const mouse = engine.input.mouse.get(),
        state = {}

      if (mouse.button[0] && !mouse.button[2]) {
        state.y = 1
      }

      if (mouse.button[2] && !mouse.button[0]) {
        state.y = -1
      }

      if (mouse.moveX) {
        // XXX: syngen hack
        const deltaMoveX = mouse.moveX - previousMoveX
        previousMoveX = mouse.moveX

        // Accelerate and clamp rotation
        rotate += engine.utility.scale(deltaMoveX, -window.innerWidth, window.innerWidth, 1, -1) * sensitivity
        rotate = engine.utility.clamp(rotate, -1, 1)
      }

      if (rotate) {
        // Apply and decelerate rotation to zero
        state.rotate = rotate
        rotate = content.utility.accelerate.value(rotate, 0, 32)
      }

      return state
    },
    requestPointerLock: function () {
      requestPointerLock()
      return this
    },
    ui: function () {
      const state = {}

      if (!isPointerLock() && isPointerLocked) {
        state.isPointerLockExit = true
        console.log('exit')
      }

      isPointerLocked = isPointerLock()

      return state
    },
  }
})()

// XXX: Hack to prevent race condition with setTimeout() call within syngen.input.mouse.update()
// TODO: Fix in syngen
engine.input.mouse.update = () => {}
