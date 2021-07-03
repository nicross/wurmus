app.toolbar = (() => {
  let musicOn,
    root

  engine.ready(() => {
    root = document.querySelector('.a-toolbar')

    musicOn = root.querySelector('.a-toolbar--musicOn')
    musicOn.addEventListener('click', onMusicOnClick)
    setTimeout(() => renderMusicOn(), 0)
  })

  function onMusicOnClick() {
    const state = musicOn.getAttribute('aria-checked') != 'true'
    app.settings.setMusicOn(state).save()
    renderMusicOn(state)
  }

  function renderMusicOn() {
    const state = app.settings.computed.musicOn
    musicOn.innerHTML = `Music ${state ? 'On' : 'Off'}`
    musicOn.setAttribute('aria-checked', state ? 'true' : 'false')
  }

  return {
    attachTo: function (element) {
      element.appendChild(root)
      return this
    },
  }
})()
