<h3>Imgur settings</h3>
<div class="row">
  <div class="col-sm-6 col-xs-12">
    <ul>
      <li>
        <p>Register an imgur app
          <a href="https://api.imgur.com/oauth2/addclient">here</a>, make sure you fill in the callback URL properly. It should be
          <code>https://yourforum.com/admin/plugins/imgur-preview/oauth</code>
          adjust based on your forum url.
        </p>
      </li>
      <li>
        <p>
          Once you register you will get a client ID and secret. Enter these values below.
        </p>
      </li>
      <li>
        <p>Optionally, create an album for your forum on imgur and put its album ID below. You can find the ID by going to the album URL and taking the characters after the `/a`. Ex. for `https://imgur.com/a/abcdef`, the ID is `abcdef`</p>
      </li>
      <li>
        <p>After entering the values click Save and then Authorize, you will be redirected to imgur to allow access to your app.
        </p>
      </li>
      <li>
        <p>Once you allow access you will be redirected back to nodebb.</p>
      </li>
    </ul>
  </div>

  <div class="col-sm-6 col-xs-12">
    <!-- IF needsAuthorization -->
    <div class="alert alert-warning">
      Access Token and/or Refresh Token missing. Please click Authorize below.
    </div>
    <!-- ENDIF needsAuthorization -->

    <form class="form">
      <div class="form-group">
        <label>Imgur Client ID</label>
        <input id="imgurClientID" type="text" class="form-control" placeholder="Enter Imgur Client ID" value="{settings.imgurClientID}">
      </div>
      <div class="form-group">
        <label>Imgur Secret</label>
        <input id="imgurSecret" type="text" class="form-control" placeholder="Enter Imgur Secret" value="{settings.imgurSecret}">
      </div>
      <div class="form-group">
        <label>Album ID</label>
        <input id="albumID" type="text" class="form-control" placeholder="Enter Album ID" value="{settings.albumID}">
      </div>
    </form>

    <button class="btn btn-primary" id="save">Save</button>
    <button class="btn btn-success" id="authorize">Authorize</button>
  </div>
</div>

<h3>Templates</h3>
<div class="jumbotron">
  <p>Available substitutions:
    <div class="row">
      <div class="col-xs-12 col-md-6">
        <ul>
          <li>
            <code>{{&nbsp;protocol&nbsp;}}</code>
            &ndash; https|http</li>
          <li>
            <code>{{&nbsp;filename&nbsp;}}</code>
            &ndash; Imgur image filename
            <code>alo92a4</code>
          </li>
          <li>
            <code>{{&nbsp;ext&nbsp;}}</code>
            &ndash; Image extension (jpg, gif, png)</li>
          <li>
            <code>{{&nbsp;altText&nbsp;}}</code>
            &ndash; Imgur image name
            <code>0_1526333420777_img</code>
          </li>
          <li>
            <code>{{&nbsp;theRest&nbsp;}}</code>
            &ndash; The rest includes default
            <code>class="img-responsive img-markdown"</code>
            code. Instead of
            <code>theRest</code>
            you could explicitly include
            <code>class="img-responsive img-markdown you-custom classes here"</code>
            in the template.
          </li>
          <li>
            <code>{{&nbsp;postData&nbsp;}}</code>
            &ndash; NodeBB's
            <code>data.postData</code>
            object. It looks like that:
          </li>
        </ul>
      </div>
      <div class="col-xs-12 col-md-6">
        <img src="/plugins/nodebb-plugin-imgur-preview/img/postData.png">
        <br>
        <code>data.postData</code>
      </div>
    </div>
  </p>
  <p>
    <small>
      Imgur
      <a href="https://api.imgur.com/models/image">thumbnail sizes</a>:
    </small>
    <ul>
      <li>
        <code>t</code>
        &ndash; 160x160
      </li>
      <li>
        <code>m</code>
        &ndash; 320x320
      </li>
      <li>
        <code>l</code>
        &ndash; 640x640
      </li>
      <li>
        <code>h</code>
        &ndash; 1024x1024
      </li>
    </ul>
  </p>
</div>

<div class="row">
  <div class="col-xs-12">
    <form class="form">
      <div class="form-group">
        <label>Current HTML Template</label>
        <code>
          <textarea rows="4" id="htmlTemplate" class="form-control" placeholder="Enter teamplate">{{settings.htmlTemplate}}</textarea>
        </code>
      </div>

      <div class="form-group">
        <label>Default HTML Template. <small>With this template you'll get the exact same HTML result as if you wouldn't use this plugin at all. It's the exact equivalent of a "NodeBB default template".</small></label>
        <code>
          <textarea rows="5" id="defaultHtmlTemplate" class="form-control" placeholder="Enter teamplate">{{settings.defaultHtmlTemplate}}</textarea>
        </code>
      </div>
    </form>
  </div>
</div>

<input id="csrf_token" type="hidden" value="{csrf}"/>

<script type="text/javascript">

  // let defaultHtmlTemplate = `<a href="{{protocol}}://i.imgur.com/{{filename}}.{{ext}}" target="_blank"><img src="{{protocol}}://i.imgur.com/{{filename}}t.{{ext}}" alt="{{altText}}" class="img-responsive img-markdown"></a>`

  // $('#htmlTemplate').value(defaultHtmlTemplate)
  $('#save').on('click', function () {
    let data = {
      _csrf: $('#csrf_token').val(),
      imgurClientID: $('#imgurClientID').val(),
      imgurSecret: $('#imgurSecret').val(),
      albumID: $('#albumID').val(),
      htmlTemplate: $('#htmlTemplate').val()
    }

    $.post(config.relative_path + '/api/admin/plugins/imgur-preview/save', data, function (data) {
      app.alert({type: 'success', alert_id: 'imgur-preview-saved', title: 'Success', message: 'Settings Saved'})
    })

    return false
  })

  $('#authorize').on('click', function () {
    const clientID = $('#imgurClientID').val()
    if (!clientID) {
      return app.alertError('[[error:no-imgur-client-id]]')
    }

    window.location = 'https://api.imgur.com/oauth2/authorize?client_id=' + clientID + '&response_type=code'
  })
</script>
