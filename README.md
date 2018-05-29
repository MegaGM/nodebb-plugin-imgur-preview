# NodeBB Imgur Plugin

A plugin that uploads images to Imgur and allows you to use custom HTML templates to give you more control over the way the images will be displayed.

This plugin might be superuseful for you if you want to seamlessly add a fancybox gallery or something like that to your NodeBB forum.


## Installation

```
npm install nodebb-plugin-imgur-preview
```
or via NodeBB ACP


## Templates

With the power of custom HTML templates, you can control exactly how images in posts will be displayed.

By default NodeBB doesn't have such templates. But it does mock with images in some way anyway. Take a look at the template which results in the exact same HTML, as if it would be produced via NodeBB without this plugin:
```handlebars
<a href="{{protocol}}://i.imgur.com/{{filename}}.{{ext}}" target="_blank">
  <img src="{{protocol}}://i.imgur.com/{{filename}}.{{ext}}" alt="{{altText}}" class="img-responsive img-markdown">
</a>
```

Well, what if you'd like to customize the output somehow? There is no way to do that by default in NodeBB. And that's why this plugin has been created. Now you gain full control of produced HTML code for images. Just imagine what you can do now.
Please, take a look at another template example:
```handlebars
<a class="fancybox gallery-{{postData.pid}}" href="{{protocol}}://i.imgur.com/{{filename}}.{{ext}}">
  <picture>
    <source srcset="{{protocol}}://i.imgur.com/{{filename}}t.{{ext}}" media="(max-width: 280px)">
    <source srcset="{{protocol}}://i.imgur.com/{{filename}}m.{{ext}}" media="(max-width: 320px)">
    <source srcset="{{protocol}}://i.imgur.com/{{filename}}l.{{ext}}" media="(max-width: 640px)">
    <source srcset="{{protocol}}://i.imgur.com/{{filename}}h.{{ext}}" media="(max-width: 1024px)">
    <img src="{{protocol}}://i.imgur.com/{{filename}}.{{ext}}" alt="{{altText}}">
  </picture>
</a>
```
With less than 10 lines of code, this template will give you as the result huge bandwidth economy + independent galleries with images grouped by NodeBB post ID `{{postData.pid}}`.

#### Warning: no fancybox plugins are included. You have to include the one you've chosen youself.

## Setup

* Register an imgur app [here](https://api.imgur.com/oauth2/addclient), make sure you fill in the callback URL properly. It should be `https://yourforum.com/admin/plugins/imgur-preview/oauth` adjust based on your forum url.
[![](https://i.imgur.com/Trqfy0Q.png)](https://i.imgur.com/Trqfy0Q.png)

* Once you register you will get a client ID and secret.
[![](http://i.imgur.com/haE9jzj.png)](http://i.imgur.com/haE9jzj.png)

* Enter these values in your NodeBB ACP page.
[![](http://i.imgur.com/p86s7lv.png)](http://i.imgur.com/p86s7lv.png)

* After entering the values click Save and then Authorize, you will be redirected to imgur to allow access to your app.

* Once you allow access you will be redirected back to nodebb.

* Optinally create an album for your forum on imgur and put its album ID in the NodeBB ACP.
