<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DesignAsset;

class DesignAssetSeeder extends Seeder
{
    public function run()
    {
        // 1. Fonts
        $fonts = [
            ['Arima', 'Display'], ['Atma', 'Handwriting'], ['Audiowide', 'Display'], 
            ['Azeret Mono', 'Monospace'], ['Bad Script', 'Handwriting'], ['Bagel Fat One', 'Display'],
            ['Bakbak One', 'Display'], ['Bangers', 'Display'], ['Berkshire Swash', 'Display'],
            ['Black Ops One', 'Display'], ['Boogaloo', 'Display'], ['Borel', 'Handwriting'],
            ['Bungee', 'Display'], ['Cabin Sketch', 'Display']
        ];

        foreach ($fonts as $f) {
            DesignAsset::updateOrCreate(['name' => $f[0]], [
                'type' => 'font',
                'category' => $f[1],
                'content' => $f[0]
            ]);
        }

        // 2. Shapes
        $shapes = [
            ['Star', 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png'],
            ['Heart', 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png'],
            ['Line', 'https://cdn-icons-png.flaticon.com/512/649/649721.png'],
            ['Triangle', 'https://cdn-icons-png.flaticon.com/512/481/481078.png'],
            ['Circle', 'https://cdn-icons-png.flaticon.com/512/481/481065.png'],
            ['Square', 'https://cdn-icons-png.flaticon.com/512/481/481072.png']
        ];

        foreach ($shapes as $s) {
            DesignAsset::updateOrCreate(['name' => $s[0]], [
                'type' => 'graphic',
                'category' => 'Shapes',
                'content' => $s[1]
            ]);
        }

        // 4. Graphics - Love
        $love = [
            ['Be Mine', 'https://cdn-icons-png.flaticon.com/512/2107/2107845.png'],
            ['Heart Arrow', 'https://cdn-icons-png.flaticon.com/512/2107/2107952.png'],
            ['Love TicTac', 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png'] // placeholder
        ];

        foreach ($love as $l) {
            DesignAsset::updateOrCreate(['name' => $l[0]], [
                'type' => 'graphic',
                'category' => 'Love',
                'content' => $l[1]
            ]);
        }
        
        // 5. Patterns
        $patterns = [
            ['Avocado', 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png'],
            ['Beach', 'https://cdn-icons-png.flaticon.com/512/2664/2664531.png']
        ];

        foreach ($patterns as $pattern) {
            DesignAsset::updateOrCreate(['name' => $pattern[0]], [
                'type' => 'graphic',
                'category' => 'Patterns',
                'content' => $pattern[1]
            ]);
        }
    }
}
