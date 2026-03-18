const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */
mix.setPublicPath('./');

mix.js('resources/app/app.js', 'public/js').react()
// .js('resources/app/components/ExtensionARPreview.jsx', 'extensions/ar-app/assets/ar-extension.js').react()
// .postCss('resources/css/app.css', 'extensions/ar-app/assets/ar-app.css')
.copyDirectory('resources/images', 'public/images');

if (mix.inProduction()) {
    mix.version();
}
