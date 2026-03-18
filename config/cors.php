<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'proxy/*', 'app/*', '*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://3d-ar-viewer.octiloapps.com',
        'https://00a7-2405-201-200c-d02b-2dcc-8cfd-6139-b9af.ngrok-free.app',
        'https://admin.shopify.com',
        '*.myshopify.com',
        '*'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];