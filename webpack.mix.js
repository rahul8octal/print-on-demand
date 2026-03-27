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
.js('resources/app/components/ExtensionDesignerPreview.jsx', 'extensions/custom-design-studio/assets/designer.js').react()
.copyDirectory('resources/images', 'public/images');

mix.options({
    terser: {
        extractComments: false,
    }
});

if (mix.inProduction()) {
    mix.version();
}
