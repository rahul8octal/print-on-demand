<?php

namespace App\Services;

use App\Helpers\ShopifyHelper;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\Internal\SettingRepository;

class ShopifyService
{
  protected User $shop;

  /**
   * Initialize ShopifyService with user credentials.
   */
  public function __construct(?User $shop)
  {
    $this->shop = $shop;
  }

  /**
   * Get Shopify Store Details.
   */
  public function getShopDetails(): array
  {
    $query = <<<'GQL'
        {
            shop {
                id
                name
                email
                contactEmail
                ianaTimezone
                primaryDomain {
                   url
                }
                plan {
                   partnerDevelopment
                   shopifyPlus
                   publicDisplayName
                }
            }
        }
        GQL;

    return $this->execute($query);
  }

  public function getThemes($themeQueries, $fileQueries = "")
  {
    $themeFields = '
            id
            name
            role';

    if ($fileQueries) {
      $themeFields .= '
            files(' . $fileQueries . ') {
              nodes {
                filename
                body {
                  ... on OnlineStoreThemeFileBodyText {
                    content
                  }
                }
              }
            }
            ';
    }
    $query = <<<QUERY
        query {
          themes($themeQueries) {
            edges {
              node {
                $themeFields
              }
            }
          }
        }
        QUERY;

    return $this->execute($query);
  }

  /**
   * Send a GraphQL request to Shopify with error handling and logging.
   */
  public function execute($query, $input = [])
  {
    $response = [];
    $retry = 3;
    do {
      try {
        $response = empty($input) ?
          $this->shop->api()->graph($query) :
          $this->shop->api()->graph($query, $input);

        $response = json_decode(json_encode($response), true);
        $retry = 0;

      } catch (\Exception $e) {
        $retry--;

        if ($retry <= 0) {
          $response = [
            'errors' => true,
            'body' => $e->getMessage(),
          ];
        }
        sleep(2);
      }
    } while ($retry > 0);

    return $response;
  }
}
