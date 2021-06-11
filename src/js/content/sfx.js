content.sfx = {}

content.sfx.bus = engine.audio.mixer.createBus()
content.sfx.bus.gain.value = engine.utility.fromDb(0)

content.sfx.footstep = function ({
  destination = content.sfx.bus,
} = {}) {
  console.log('footstep')
}
