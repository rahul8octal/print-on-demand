<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DesignAsset;

class DesignAssetSeeder extends Seeder
{
    public function run()
    {
        // 1. Fonts
     $Fonts = [
        
    // 🔹 Modern Sans-serif
        ['Rubik', 'Sans-serif'], ['Kanit', 'Sans-serif'], ['Hind', 'Sans-serif'],
        ['Mulish', 'Sans-serif'], ['Asap', 'Sans-serif'], ['Barlow', 'Sans-serif'],
        ['Barlow Condensed', 'Sans-serif'], ['Barlow Semi Condensed', 'Sans-serif'],
        ['Figtree', 'Sans-serif'], ['Heebo', 'Sans-serif'], ['IBM Plex Sans', 'Sans-serif'],
        ['Public Sans', 'Sans-serif'], ['Red Hat Display', 'Sans-serif'],
        ['Red Hat Text', 'Sans-serif'], ['Signika', 'Sans-serif'],
        ['Exo 2', 'Sans-serif'], ['Questrial', 'Sans-serif'],
        ['Assistant', 'Sans-serif'], ['Cabin', 'Sans-serif'],
        ['Karla', 'Sans-serif'], ['PT Sans', 'Sans-serif'],

        // 🔹 Serif Premium
        ['Crimson Text', 'Serif'], ['Crimson Pro', 'Serif'],
        ['EB Garamond', 'Serif'], ['Zilla Slab', 'Serif'],
        ['Alegreya', 'Serif'], ['Alegreya Sans', 'Sans-serif'],
        ['Vollkorn', 'Serif'], ['Bitter', 'Serif'],
        ['Domine', 'Serif'], ['Prata', 'Serif'],

        // 🔹 Display / Heading
        ['Archivo Black', 'Display'], ['Alfa Slab One', 'Display'],
        ['Abril Fatface', 'Display'], ['Cinzel', 'Display'],
        ['DM Serif Display', 'Display'], ['Josefin Sans', 'Display'],
        ['Righteous', 'Display'], ['Syncopate', 'Display'],
        ['Chakra Petch', 'Display'], ['Gruppo', 'Display'],

        // 🔹 Handwriting / Script
        ['Allura', 'Handwriting'], ['Alex Brush', 'Handwriting'],
        ['Cookie', 'Handwriting'], ['Marck Script', 'Handwriting'],
        ['Sacramento', 'Handwriting'], ['Tangerine', 'Handwriting'],
        ['Yellowtail', 'Handwriting'], ['Handlee', 'Handwriting'],

        // 🔹 Monospace (for dev / tech UI)
        ['Fira Code', 'Monospace'], ['JetBrains Mono', 'Monospace'],
        ['Source Code Pro', 'Monospace'], ['IBM Plex Mono', 'Monospace'],
        ['Inconsolata', 'Monospace']
    ];

        foreach ($Fonts as $f) {
            DesignAsset::updateOrCreate(['name' => $f[0]], [
                'type' => 'font',
                'category' => $f[1],
                'content' => $f[0]
            ]);
        }

        // 2. Shapes
        $shapes = [
            ['Home', 'home.svg'],
            ['Star', 'star.svg'],
            ['Heart', 'heart.svg'],
            ['Line', 'line.svg'],
            ['Triangle', 'triangle.svg'],
            ['Circle', 'circle.svg'],
            ['Square', 'square.svg'],
            ['Add Image', 'add-image.svg'],
            ['Address Book', 'address-book.svg'],
            ['Address Card', 'address-card.svg'],
            ['Android', 'android.svg'],
            ['Apple Pay', 'apple-pay.svg'],
            ['Apple', 'apple.svg'],
            ['Marker', 'marker.svg'],
            ['Twitter', 'twitter.svg'],
            ['Add', 'add.svg'],
            ['Game', 'game.svg'],
            ['Headset', 'headset.svg'],
            ['Search', 'search.svg'],
            ['Shopping Cart', 'shopping-cart.svg'],
            ['Tik Tok', 'tik-tok.svg']
        ];

        foreach ($shapes as $s) {
            DesignAsset::updateOrCreate(['name' => $s[0]], [
                'type' => 'element',
                'category' => 'Shapes',
                'content' => 'assets/shapes/' . $s[1]
            ]);
        }

        // 4. Element - Love
        $love = [
            ['Be Mine', 'be-mine.svg'],
            ['Heart Arrow', 'heart-arrow.svg'],
            ['Love TicTac', 'love-tictac.svg']
        ];

        foreach ($love as $l) {
            DesignAsset::updateOrCreate(['name' => $l[0]], [
                'type' => 'element',
                'category' => 'Love',
                'content' => 'assets/shapes/' . $l[1]
            ]);
        }
        
        // 5. Patterns
        $patterns = [
            ['Avocado', 'avocado.svg'],
            ['Beach', 'beach.svg']
        ];

        foreach ($patterns as $p) {
            DesignAsset::updateOrCreate(['name' => $p[0]], [
                'type' => 'element',
                'category' => 'Patterns',
                'content' => 'assets/shapes/' . $p[1]
            ]);
        }
    }
}
