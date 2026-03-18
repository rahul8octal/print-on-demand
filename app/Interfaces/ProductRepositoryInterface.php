<?php

namespace App\Interfaces;

interface ProductRepositoryInterface
{
    public function all();

    public function store($input);

    public function read($id);

    public function update($id, $input);

    public function delete($id);

    public function updateStatus($id);

    public function getModel($input);
    
    public function enforceProductLimitForShop($shopId): void;
}
