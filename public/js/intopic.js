(function () {
  /**
   * let's start with a hack
   * When NodeBB loads a topic, it searches posts for any `<img>` which are not yet
   * wrapped with an `<a>`, and wraps them into an `<a>` tag.
   *
   * To get better control of the eventual HTML code in posts
   * nodebb-plugin-imgur-preview provides custom templates.
   * In order for the templates to be more adjustable
   * we have to avoid wrapping `<img>` into anchors we have not control over.
   *
   * Therefore we elliminate the real Images.wrapImagesInLinks() from execution.
   *
   * You can find the original function in NodeBB/public/src/client/topic/images.js
   */
  require(['forum/topic/images'], function (Images) {
    if (Images && Images.wrapImagesInLinks)
      Images.wrapImagesInLinks = () => {}
  })

  /**
   * Some kind of "autodetection which thumbnail to use" logic have been implemented.
   * Still have to add an on/off `checkbox` onto settings page to include the functionality.
   * TODO: if settings.autodetect then add listener
   */
  // $(window).on('action:images.loaded', changeThumbnailSize)

  function changeThumbnailSize() {
    const onTopicPage = 0 === window.location.pathname.indexOf('/topic')
    if (!onTopicPage)
      return

    let
      topic = $('[component="topic"]'),
      w = topic.width(),
      size = 'm'
    /**
     * decide on topic's container width which thumbnail to pick up
     * available sizes = {t: 160, m: 320, l: 640, h: 1024}
     */
    if (w < 280)
      size = 't'

    if (w > 280 && w <= 320)
      size = 'm'

    if (w > 320 && w <= 640)
      size = 'l'

    if (w > 640)
      size = 'h'

    topic.find('[component="post/content"] img:not(.emoji)').each((i, el) => {
      let
        $el = $(el),
        src = $el.attr('src') || '',
        alt = $el.attr('alt') || ''

      let
        regex = /^(https|http):\/\/i.imgur.com\/([^\.]+)\.(.+)$/i,
        newSrc = '',
        match = src.match(regex)

      if (!match)
        return
      if ($el.attr('data-state-imgur-preview') === 'loaded')
        return

      let [input, protocol, filename, ext] = match,
      oldFilename = filename

      if (filename.length === 7)
        filename = filename + size

      if (filename.length === 8) {
        let
          arr = filename.split(''),
          oldSize = arr.pop()

        filename = arr.join('') + size
      }
      if (filename !== oldFilename) {
        newSrc = `${protocol}://i.imgur.com/${filename}.${ext}`
        $el.attr('src', newSrc)
      }
      $el.attr('data-state-imgur-preview', 'loaded');
    })
  }
})()
