app.controls.gamepad = {
  game: function () {
    const state = {}

    let rotate = 0,
      x = 0,
      y = 0

    if (engine.input.gamepad.hasAxis(0, 1, 2)) {
      rotate = engine.input.gamepad.getAxis(2, true)
      x = engine.input.gamepad.getAxis(0)
      y = engine.input.gamepad.getAxis(1, true)
    } else if (engine.input.gamepad.hasAxis(0, 1)) {
      rotate = engine.input.gamepad.getAxis(0, true)
      y = engine.input.gamepad.getAxis(1, true)
    }

    if (engine.input.gamepad.isDigital(12)) {
      y = 1
    }

    if (engine.input.gamepad.isDigital(13)) {
      y = -1
    }

    if (engine.input.gamepad.isDigital(14)) {
      rotate = 1
    }

    if (engine.input.gamepad.isDigital(15)) {
      rotate = -1
    }

    if (engine.input.gamepad.isDigital(6) || engine.input.gamepad.isDigital(7)) {
      state.attack = true
    }

    if (rotate) {
      state.rotate = engine.utility.clamp(rotate, -1, 1)
    }

    if (x) {
      state.x = engine.utility.clamp(x, -1, 1)
    }

    if (y) {
      state.y = engine.utility.clamp(y, -1, 1)
    }

    return state
  },
  ui: function () {
    const state = {}

    let x = engine.input.gamepad.getAxis(0),
      y = engine.input.gamepad.getAxis(1, true)

    if (engine.input.gamepad.isDigital(0) || engine.input.gamepad.isDigital(8) || engine.input.gamepad.isDigital(9)) {
      state.confirm = true
    }

    if (engine.input.gamepad.isDigital(12)) {
      y = 1
    }

    if (engine.input.gamepad.isDigital(13)) {
      y = -1
    }

    if (engine.input.gamepad.isDigital(14)) {
      x = -1
    }

    if (engine.input.gamepad.isDigital(15)) {
      x = 1
    }

    const absX = Math.abs(x),
      absY = Math.abs(y)

    if (absX - absY >= 0.125) {
      if (x < 0) {
        state.left = true
      } else {
        state.right = true
      }
    } else if (absY - absX >= 0.125) {
      if (y < 0) {
        state.down = true
      } else {
        state.up = true
      }
    }

    return state
  },
}
