'use strict'

const
  fs = require('fs'),
  request = require('request'),
  winston = require('winston'),
  Handlebars = require('handlebars'),
  nconf = require.main.require('nconf'),
  async = require.main.require('async'),
  db = require.main.require('./src/database'),
  plugins = require.main.require('./src/plugins')
const
  dbSettingsKey = 'nodebb-plugin-imgur-preview',
  defaultHtmlTemplate = `<a href="{{protocol}}://i.imgur.com/{{filename}}.{{ext}}" target="_blank">
  <img src="{{protocol}}://i.imgur.com/{{filename}}.{{ext}}" alt="{{altText}}" class="img-responsive img-markdown">
</a>`
let
  compiledTemplate = null

module.exports = {
  init,
  menu,
  upload,
  parseRaw,
  parsePost,
}

function init(params, callback) {
  params.router.get('/admin/plugins/imgur-preview/oauth', authorize)
  params.router.get('/admin/plugins/imgur-preview', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin)
  params.router.get('/api/admin/plugins/imgur-preview', params.middleware.applyCSRF, renderAdmin)
  params.router.post('/api/admin/plugins/imgur-preview/save', params.middleware.applyCSRF, save)
  recompileTemplate()
  callback()
}

/**
 * compile fresh template
 */
function recompileTemplate(callback) {
  db.getObject(dbSettingsKey, function (err, settings) {
    settings = settings || {}
    let data = { htmlTemplate: null }

    if (settings.htmlTemplate) {
      data.htmlTemplate = settings.htmlTemplate
    } else {
      data.htmlTemplate = defaultHtmlTemplate
      db.setObject(dbSettingsKey, data)
    }

    compiledTemplate = Handlebars.compile(data.htmlTemplate)
    callback && callback(null, compiledTemplate)
  })
}

function parser(data, callback) {
  let content = (data && data.postData && data.postData.content) || data
  if (!data)
    return callback(null, data)

  const regexp = /<img src="(https|http):\/\/i.imgur.com\/([^\.]+)\.([^"]+)" alt="([^"\.]+)[^"]+" ([^>]+)>/gi

  content = content.replace(regexp, (input, protocol, filename, ext, altText, theRest) => {
    // if (filename.length === 8) {
    //   let
    //     arr = filename.split(''),
    //     oldSize = arr.pop()
    //   filename = arr.join('')
    //
    //   if (oldSize === 'a')
    //     filename = filename + size
    //   else
    //     filename = filename + oldSize
    // }
    let html = compiledTemplate({ postData: data.postData, protocol, filename, ext, altText, theRest })
    return html
  })

  callback(null, content)
}

function parsePost(data, callback) {
  if (data && data.postData && data.postData.content) {
    parser(data, function (err, content) {
      data.postData.content = content
      callback(err, data)
    })
  } else
    callback(null, data)
}

function parseRaw(raw, callback) {
  if (raw) {
    parser(raw, function (err, raw) {
      callback(err, raw)
    })
  } else
    callback(null, raw)
}

function save(req, res, next) {
  let data = {
    imgurClientID: req.body.imgurClientID || '',
    imgurSecret: req.body.imgurSecret || '',
    albumID: req.body.albumID || '',
    htmlTemplate: req.body.htmlTemplate,
  }

  db.setObject('nodebb-plugin-imgur-preview', data, function (err) {
    if (err)
      return next(err)

    recompileTemplate()
    res.status(200).json({ message: 'Settings saved!' })
  })
}

function authorize(req, res, next) {
  if (!req.query.code)
    return next(new Error('[[error:invalid-code-from-imgur]]'))

  let settings
  async.waterfall([
    function (next) {
      db.getObject(dbSettingsKey, next)
    },
    function (_settings, next) {
      settings = _settings || {}

      if (!settings.imgurClientID)
        return next(new Error('[[error:no-imgur-client-id]]'))

      if (!settings.imgurSecret)
        return next(new Error('[[error:no-imgur-secret]]'))

      request.post({
        url: 'https://api.imgur.com/oauth2/token',
        formData: {
          client_id: settings.imgurClientID,
          client_secret: settings.imgurSecret,
          grant_type: 'authorization_code',
          code: req.query.code
        }
      }, function (err, response, body) {
        if (err) return next(err)
        saveTokens(body, next)
      })
    }
  ], function (err) {
    if (err) return next(err)
    res.redirect(nconf.get('relative_path') + '/admin/plugins/imgur-preview')
  })
}

function refreshToken(callback) {
  async.waterfall([
    function (next) {
      db.getObject(dbSettingsKey, next)
    },
    function (settings, next) {
      settings = settings || {}

      if (!settings.imgurClientID || !settings.imgurSecret)
        return callback(new Error('[[error:invalid-imgur-id-or-secret]]'))

      if (!settings.refresh_token)
        return callback(new Error('[[error:invalid-refresh-token]]'))

      request.post({
        url: 'https://api.imgur.com/oauth2/token',
        formData: {
          client_id: settings.imgurClientID,
          client_secret: settings.imgurSecret,
          grant_type: 'refresh_token',
          refresh_token: settings.refresh_token
        }
      }, function (err, response, body) {
        if (err) return callback(err)

        saveTokens(body, next)
      })
    }
  ], callback)
}

function saveTokens(data, callback) {
  try {
    data = JSON.parse(data)
  } catch (err) {
    return callback(err)
  }
  data.expiresAt = Date.now() + parseInt(data.expires_in, 10) * 1000

  if (!data.access_token)
    return callback(new Error('[[error:unable-to-get-access-token]]'))

  if (!data.refresh_token)
    return callback(new Error('[[error:unable-to-get-refresh-token]]'))

  db.setObject(dbSettingsKey, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiresAt: data.expiresAt
  }, function (err) {
    callback(err)
  })
}

function renderAdmin(req, res, next) {
  db.getObject(dbSettingsKey, function (err, settings) {
    if (err) return next(err)

    settings = settings || {}
    let data = {
      imgurClientID: settings.imgurClientID,
      imgurSecret: settings.imgurSecret,
      albumID: settings.albumID,
      needsAuthorization: !settings.access_token || !settings.refresh_token,
      htmlTemplate: settings.htmlTemplate || defaultHtmlTemplate,
      defaultHtmlTemplate,
    }
    res.render('admin/plugins/imgur-preview', { settings: data, csrf: req.csrfToken() })
  })
}

function upload(data, callback) {
  let
    settings,
    image = data.image

  if (!image)
    return callback(new Error('invalid image'))

  async.waterfall([
    function (next) {
      db.getObject(dbSettingsKey, next)
    },
    function (_settings, next) {
      settings = _settings || {}

      if (!settings.imgurClientID)
        return next(new Error('invalid-imgur-client-id'))

      if (Date.now() >= settings.expiresAt) {
        refreshToken(next)
      } else
        next()
    },
    function (next) {
      doUpload(data, settings, next)
    }
  ], callback)
}

function doUpload(data, settings, callback) {
  function done(err) {
    if (!callbackCalled) {
      callbackCalled = true
      callback(err)
    }
  }

  let
    image = data.image,
    callbackCalled = false,
    type = image.url ? 'url' : 'file'

  if (type === 'file' && !image.path)
    return callback(new Error('invalid image path'))

  let formDataImage
  if (type === 'file') {
    formDataImage = fs.createReadStream(image.path)
    formDataImage.on('error', function (err) {
      done(err)
    })
  } else if (type === 'url')
    formDataImage = image.url
  else
    return callback(new Error('unknown-type'))

  const options = {
    url: 'https://api.imgur.com/3/upload.json',
    headers: {
      'Authorization': 'Bearer ' + settings.access_token
    },
    formData: {
      type: type,
      image: formDataImage
    }
  }

  if (settings.albumID)
    options.formData.album = settings.albumID

  request.post(options, function (err, req, body) {
    if (err) return done(err)

    let response
    try {
      response = JSON.parse(body)
    } catch (err) {
      winston.error('Unable to parse Imgur json response. [' + body + ']', err.message)
      return done(err)
    }

    if (response.success)
      return callback(null, {
        name: image.name,
        url: response.data.link.replace('http:', 'https:')
      })

    if (response.data.error && response.data.error === 'The access token provided is invalid.') {
      async.waterfall([
        function (next) {
          refreshToken(next)
        },
        function (next) {
          imgur.upload(data, next)
        }
      ], callback)
      return
    }

    done(new Error(response.data.error.message || response.data.error))
  })
}

function menu(menu, callback) {
  menu.plugins.push({
    route: '/plugins/imgur-preview',
    icon: 'fa-cloud-upload',
    name: 'Imgur Preview'
  })

  callback(null, menu)
}
