<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductModuleResource;
use App\Http\Resources\ProductResource;
use App\Interfaces\ProductRepositoryInterface;
use App\Models\DemoProduct;
use App\Models\Product;
use App\Models\ThemeConfig;
use App\Models\ProductConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{

  private ProductRepositoryInterface $productRepo;

    public function __construct(ProductRepositoryInterface $productRepo)
    {
        $this->productRepo = $productRepo;
    }

    public function shopifyProducts(Request $request)
    {
        $shop = Auth::user();
        try {
            $version = config('shopify-app.api_version', '2024-04');
            $response = $shop->api()->rest('GET', "/admin/api/{$version}/products.json");
            
            if ($response['errors']) {
                $errorMsg = json_encode($response['errors']);
                Log::error('Shopify Product Fetch Error:', [
                    'shop' => $shop->name,
                    'version' => $version,
                    'response' => $response
                ]);
                return response()->json(['success' => false, 'message' => "Shopify API Error: {$errorMsg}"], 500);
            }
            
            $products = $response['body']->container['products'];
            
            // Cross-reference with our database to see which ones are already configured
            $configuredIds = Product::where('user_id', '=', $shop->id, 'and')
                ->pluck('product_id')
                ->toArray();
                
            foreach ($products as &$sp) {
                $sp['is_configured'] = in_array($sp['id'], $configuredIds);
            }

            return response()->json(['success' => true, 'data' => $products]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function togglePod(Request $request)
    {
        $request->validate([
            'product_id' => 'required',
            'product_title' => 'required',
        ]);
        
        $shop = Auth::user();
        $product = Product::where('user_id', '=', $shop->id, 'and')
            ->where('product_id', '=', $request->product_id, 'and')
            ->first();
            
        if ($product) {
            $product->delete();
            return response()->json(['success' => true, 'message' => 'Product removed from POD Catalog']);
        }
        
        Product::create([
            'user_id' => $shop->id,
            'product_id' => $request->product_id,
            'is_active' => true
        ]);
        
        return response()->json(['success' => true, 'message' => 'Product added to POD Catalog']);
    }

  public function index(Request $request)
  {
    $products = $this->productRepo->all();

    $products = ProductResource::collection($products);

    return $this->sendResponse($products, "Product retrieved successfully");
  }

  public function store(Request $request)
  {
    useMoreMemory();
    $request->validate([
      'product_id' => 'required',
      'model' => 'required_without:model_url|file|extensions:gltf,glb|max:102400',
      'model_url' => 'required_without:model|url'
    ], [
      'model.required_without' => '3D model file or URL is required.',
      'model.extensions' => 'Only GLTF, GLB model files are allowed.',
      'model.max' => '3D model file must be under 100MB.',
    ]);

    $input = $request->all();

    $alreadyExist = Product::where('product_id', $input['product_id'])->first();
    if ($alreadyExist) {
      return $this->sendError('Product already exists.', 409);
    }

    $shop = Auth::user(); 

    if ($request->hasFile('model')) {
      $file = $request->file('model');
      $shopifyFileData = $this->uploadModelToShopify($file, $shop, $input['product_id']);
      $input['model_url'] = $shopifyFileData['cdnUrl'];
      $input['shopify_file_id'] = $shopifyFileData['fileId'];
    } elseif ($request->filled('model_url')) {
        // Download the model from the URL
        $tempFile = tempnam(sys_get_temp_dir(), 'ai_model');
        $content = file_get_contents($request->input('model_url'));
        file_put_contents($tempFile, $content);
        
        $file = new \Illuminate\Http\UploadedFile(
            $tempFile,
            'model.glb',
            'model/gltf-binary',
            null,
            true
        );

        $shopifyFileData = $this->uploadModelToShopify($file, $shop, $input['product_id']);
        $input['model_url'] = $shopifyFileData['cdnUrl'];
        $input['shopify_file_id'] = $shopifyFileData['fileId'];
        $input['model_file'] = $file;
    }

    $product = $this->productRepo->store($input);

    if (isset($tempFile)) {
        @unlink($tempFile);
    }

    return $this->sendResponse($product, "Model saved successfully");
  }

  public function show($id)
  {
    $product = $this->productRepo->read($id);

    $product = ProductResource::make($product);

    return $this->sendResponse($product, "Product retrieved successfully.");
  }


    public function update(Request $request, $id)
    {
        useMoreMemory();
        $request->validate([
            'product_id' => 'sometimes|required',
            'model' => 'sometimes|file|extensions:gltf,glb|max:102400'
        ], [
            'model.extensions' => 'Only GLTF, GLB model files are allowed.',
            'model.max' => '3D model file must be under 100MB.',
        ]);

        $input = $request->all();

        $product = Product::where('user_id', '=', AuthId())->findOrFail($id);
        $shop = Auth::user();

        if ($request->hasFile('model')) {
            // Delete old file from Shopify if it exists
            if ($product->shopify_file_id) {
                $this->deleteShopifyFile($product->shopify_file_id, $shop);
            }

            $file = $request->file('model');
            $shopifyFileData = $this->uploadModelToShopify($file, $shop, $product->product_id);
            $request->merge([
                'model_url' => $shopifyFileData['cdnUrl'],
                'shopify_file_id' => $shopifyFileData['fileId']
            ]);
        }

        $product = $this->productRepo->update($id, $request);

        return $this->sendResponse($product, "Product updated successfully");
    }

    public function returnPodCatalog()
    {
        $ids = Product::where('is_active', '=', true)
            ->pluck('product_id');

        return response()->json(['success' => true, 'ids' => $ids]);
    }

  private function uploadModelToShopify($file, $shop, $productId)
  {
    set_time_limit(300); // Increase PHP execution time to 5 minutes

    // Increase Shopify API timeout
    $options = $shop->api()->getOptions();
    $guzzleOptions = $options->getGuzzleOptions();
    $guzzleOptions['timeout'] = 120; // 2 minutes
    $options->setGuzzleOptions($guzzleOptions);
    $shop->api()->setOptions($options);

    if (!$file->isValid()) {
      throw new \Exception('Invalid uploaded file');
    }

    if ($file->getSize() <= 0) {
      throw new \Exception('File size is zero');
    }

    /** -------------------------------
     * 1️⃣ Resource + MIME
     * ------------------------------- */
    $extension = strtolower($file->getClientOriginalExtension());

    $resourceType = 'FILE';
    $mimeType = 'application/octet-stream';

    if ($extension === 'glb') {
      $resourceType = 'FILE';
      $mimeType = 'model/gltf-binary';
    } elseif ($extension === 'gltf') {
      $resourceType = 'FILE';
      $mimeType = 'model/gltf+json';
    }

    /** -------------------------------
     * 2️⃣ stagedUploadsCreate
     * ------------------------------- */
    $query = <<<'GQL'
                mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
                  stagedUploadsCreate(input: $input) {
                    stagedTargets {
                      url
                      resourceUrl
                      parameters {
                        name
                        value
                      }
                    }
                    userErrors {
                      message
                    }
                  }
                }
            GQL;

    $variables = [
      'input' => [
        [
          'filename' => $file->getClientOriginalName(),
          'mimeType' => $mimeType,
          'resource' => $resourceType,
          'fileSize' => (string) $file->getSize(),
        ]
      ]
    ];

    $response = $shop->api()->graph($query, $variables);

    if (isset($response['errors']) && !empty($response['errors'])) {
      Log::error('Shopify API errors:', ['errors' => $response['errors']]);
      throw new \Exception('Shopify API error: ' . json_encode($response['errors']));
    }

    $body = json_decode(json_encode($response['body']), true);
    $data = $body['data'] ?? null;

    if (isset($data['stagedUploadsCreate']['userErrors']) && !empty($data['stagedUploadsCreate']['userErrors'])) {
      $errorMsg = $data['stagedUploadsCreate']['userErrors'][0]['message'];
      Log::error('Shopify Staged Upload User Errors:', ['errors' => $data['stagedUploadsCreate']['userErrors']]);
      throw new \Exception('Shopify error: ' . $errorMsg);
    }

    $target = $data['stagedUploadsCreate']['stagedTargets'][0] ?? null;
    if (!$target) {
      Log::error('Shopify Staged Upload Response Body:', ['body' => $body]);
      throw new \Exception('Failed to create staged upload: Empty target');
    }

    /** -------------------------------
     * 3️⃣ Upload binary
     * ------------------------------- */
    $fileBinary = file_get_contents($file->getRealPath());
    $url = $target['url'];

    if (str_contains($url, 'Signature') || str_contains($url, 'X-Goog-Signature') || empty($target['parameters'])) {
      $uploadResponse = Http::timeout(240)->withBody($fileBinary, $mimeType)->put($url);
    } else {
      $http = Http::timeout(240)->asMultipart();
      foreach ($target['parameters'] as $param) {
        $http->attach($param['name'], $param['value']);
      }
      $uploadResponse = $http->attach('file', $fileBinary, $file->getClientOriginalName())
        ->post($url);
    }

    if (!$uploadResponse->successful()) {
      throw new \Exception('Binary upload failed');
    }

    /** -------------------------------
     * 4️⃣ fileCreate (Only for non-3D models/files)
     * ------------------------------- */
    $fileId = null;

    if ($resourceType !== 'MODEL_3D') {
      $query = <<<'GQL'
                  mutation fileCreate($files: [FileCreateInput!]!) {
                    fileCreate(files: $files) {
                      files {
                        id
                        fileStatus
                        ... on GenericFile {
                          url
                        }
                        ... on MediaImage {
                          image {
                            url
                          }
                        }
                        ... on Model3d {
                          sources {
                            url
                          }
                        }
                      }
                      userErrors {
                        message
                      }
                    }
                  }
              GQL;

      $variables = [
        'files' => [
          [
            'originalSource' => $target['resourceUrl'],
            'alt' => 'Product File',
          ]
        ]
      ];

      $response = $shop->api()->graph($query, $variables);

      if (isset($response['errors']) && !empty($response['errors'])) {
        Log::error('Shopify fileCreate API errors:', ['errors' => $response['errors']]);
        throw new \Exception('Shopify fileCreate API error: ' . json_encode($response['errors']));
      }

      $body = json_decode(json_encode($response['body']), true);
      $data = $body['data'] ?? null;

      if (isset($data['fileCreate']['userErrors']) && !empty($data['fileCreate']['userErrors'])) {
        Log::error('Shopify fileCreate User Errors:', ['errors' => $data['fileCreate']['userErrors']]);
        throw new \Exception('Shopify fileCreate error: ' . $data['fileCreate']['userErrors'][0]['message']);
      }

      $fileData = $data['fileCreate']['files'][0] ?? null;
      if (!$fileData) {
        throw new \Exception('fileCreate failed: No file data');
      }

      $fileId = $fileData['id'];
    }

    /** -------------------------------
     * 6️⃣ Attach model to product (REQUIRED for MODEL_3D)
     * ------------------------------- */
    if ($resourceType === 'MODEL_3D') {
      $mediaQuery = <<<'GQL'
        mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media {
              ... on Model3d {
                id
                fileStatus
                sources {
                  url
                }
              }
            }
            userErrors {
              message
            }
          }
        }
    GQL;

      $mediaVariables = [
        'productId' => "gid://shopify/Product/{$productId}",
        'media' => [
          [
            'mediaContentType' => 'MODEL_3D',
            'originalSource' => $target['resourceUrl'],
            'alt' => '3D Product Model',
          ]
        ]
      ];

      $mediaResponse = $shop->api()->graph($mediaQuery, $mediaVariables);

      if (isset($mediaResponse['errors']) && !empty($mediaResponse['errors'])) {
        Log::error('Shopify productCreateMedia API errors:', ['errors' => $mediaResponse['errors']]);
        throw new \Exception('Shopify productCreateMedia API error: ' . json_encode($mediaResponse['errors']));
      }

      $mediaBody = json_decode(json_encode($mediaResponse['body']), true);
      $mediaData = $mediaBody['data'] ?? null;

      if (isset($mediaData['productCreateMedia']['userErrors']) && !empty($mediaData['productCreateMedia']['userErrors'])) {
        Log::error('Shopify productCreateMedia User Errors:', ['errors' => $mediaData['productCreateMedia']['userErrors']]);
        throw new \Exception('Shopify productCreateMedia error: ' . $mediaData['productCreateMedia']['userErrors'][0]['message']);
      }

      $mediaResults = $mediaData['productCreateMedia']['media'] ?? [];
      if (!empty($mediaResults)) {
        $fileId = $mediaResults[0]['id'];
      } else {
        throw new \Exception('productCreateMedia failed: No media results');
      }
    }

    /** -------------------------------
     * 5️⃣ Poll for CDN URL
     * ------------------------------- */
    $cdnUrl = null;

    for ($i = 0; $i < 10; $i++) {

      $statusQuery = <<<'GQL'
                query getFile($id: ID!) {
                  node(id: $id) {
                    ... on Model3d {
                      fileStatus
                      sources {
                        url
                      }
                    }
                    ... on GenericFile {
                      fileStatus
                      url
                    }
                    ... on MediaImage {
                      fileStatus
                      image {
                        url
                      }
                    }
                  }
                }
              GQL;

      $statusResponse = $shop->api()->graph($statusQuery, ['id' => $fileId]);
      $statusBody = json_decode(json_encode($statusResponse['body']), true);
      $statusData = $statusBody['data'] ?? null;
      $node = $statusData['node'] ?? null;

      if (!$node) {
        sleep(2);
        continue;
      }

      if ($node['fileStatus'] === 'READY') {
        if (!empty($node['sources']) && !empty($node['sources'][0]['url'])) {
          $cdnUrl = $node['sources'][0]['url']; // ✅ Model3d
        } elseif (!empty($node['url'])) {
          $cdnUrl = $node['url'];               // ✅ GenericFile
        } elseif (!empty($node['image']['url'])) {
          $cdnUrl = $node['image']['url'];     // ✅ MediaImage
        }

        if ($cdnUrl) {
          break;
        }
      }

      if ($node['fileStatus'] === 'FAILED') {
        throw new \Exception('Shopify file processing failed');
      }

      sleep(2);
    }

    if (!$cdnUrl) {
      throw new \Exception('Shopify CDN URL not ready after polling');
    }

    return ['cdnUrl' => $cdnUrl, 'fileId' => $fileId];
  }

  private function deleteShopifyFile($fileId, $shop)
  {
    $query = <<<'GQL'
    mutation fileDelete($fileIds: [ID!]!) {
      fileDelete(fileIds: $fileIds) {
        deletedFileIds
        userErrors {
          field
          message
        }
      }
    }
    GQL;

    $variables = [
      'fileIds' => [$fileId]
    ];

    try {
      $shop->api()->graph($query, $variables);
    } catch (\Exception $e) {
      Log::info("Failed to delete Shopify file: " . $e->getMessage());
    }
  }


  public function destroy($id)
  {
    $this->productRepo->delete($id);

    return $this->sendSuccess('Product deleted successfully');
  }

  public function updateStatus($id)
  {
    $this->productRepo->updateStatus($id);

    return $this->sendSuccess("Product status updated successfully");
  }

  public function getModel(Request $request)
  {
    $input = $request->all();

    $product = $this->productRepo->getModel($input);

    if (!$product) {
      return $this->sendError('Product not found or inactive.', 404);
    }

    return $this->sendResponse($product, "Product model retrieved successfully.");
  }

  public function getPublicModel(Request $request)
  {
    $input = $request->validate([
      'product_id' => 'required'
    ]);

    $productId = $input['product_id'];

    $productForShop = Product::where('product_id', $productId)->first();

    if ($productForShop) {
      $this->productRepo->enforceProductLimitForShop($productForShop->user_id);
    }

    $product = Product::where('product_id', $productId)
      ->where('is_active', true)
      ->with('user')
      ->first();

    $responseData = null;

    if ($product) {
      $responseData = ProductModuleResource::make($product)->resolve();

      // Fetch product details from Shopify using the associated user (shop)
      if ($product->user) {
        try {
          $response = $product->user->api()->rest(
            'GET',
            "/admin/api/2024-01/products/{$productId}.json"
          );

          if (!$response['errors']) {
            $shopifyProduct = $response['body']->container['product'] ?? null;
            if ($shopifyProduct) {
              $responseData['shopify_details'] = $shopifyProduct;
            }
          }
        } catch (\Exception $e) {
          Log::info($e->getMessage());
        }
      }
    }

    return $this->sendResponse($responseData, "Product model retrieved successfully.");
  }

  public function showPublicModelAR($productId)
  {
    $product = Product::where('id', $productId)
      ->where('is_active', true)
      ->first();

    if (!$product) {
      abort(404, 'Product not found or inactive');
    }

    $modelUrl = $product->model_url ?? $product->product_model;

    return view('ar_view', ['modelUrl' => $modelUrl, 'product' => $product]);
  }

  public function showPublicAR($productId)
  {
    $product = Product::where('product_id', $productId)
      ->where('is_active', true)
      ->first();

    if (!$product) {
      abort(404, 'Product not found or inactive');
    }

    $modelUrl = $product->model_url ?? $product->product_model;

    return view('ar_view', ['modelUrl' => $modelUrl, 'product' => $product]);
  }
}
