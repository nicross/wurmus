app.toolbar = (() => {
  let graphicsOn,
    musicOn,
    root

  engine.ready(() => {
    root = document.querySelector('.a-toolbar')

    graphicsOn = root.querySelector('.a-toolbar--graphicsOn')
    graphicsOn.addEventListener('click', onGraphicsOnClick)
    setTimeout(() => renderGraphicsOn(), 0)

    musicOn = root.querySelector('.a-toolbar--musicOn')
    musicOn.addEventListener('click', onMusicOnClick)
    setTimeout(() => renderMusicOn(), 0)
  })

  function onGraphicsOnClick() {
    const state = graphicsOn.getAttribute('aria-checked') != 'true'
    app.settings.setGraphicsOn(state).save()
    renderGraphicsOn()
  }

  function renderGraphicsOn() {
    const state = app.settings.computed.graphicsOn
    graphicsOn.setAttribute('aria-checked', state ? 'true' : 'false')
  }

  function onMusicOnClick() {
    const state = musicOn.getAttribute('aria-checked') != 'true'
    app.settings.setMusicOn(state).save()
    renderMusicOn()
  }

  function renderMusicOn() {
    const state = app.settings.computed.musicOn
    musicOn.setAttribute('aria-checked', state ? 'true' : 'false')
  }

  return {
    attachTo: function (element) {
      element.appendChild(root)
      return this
    },
  }
})()
