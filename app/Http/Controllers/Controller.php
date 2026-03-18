<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseController;
use Response;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * @param array|mixed $result
     * @param string $message
     * @param int $code
     *
     * @return JsonResponse
     */
    public function sendResponse($result, $message, $code = 200)
    {
        return response()->json(
            [
                'data' => $result,
                'message' => $message,
            ],
            $code,
            [],
            JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );
    }

    public function sendResponseWithUtf($result, $message, $code = 200)
    {
        return response()->json(
            [
                'data' => $result,
                'message' => $message,
            ],
            $code,
            [],
            JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );
    }

    /**
     * @param array $errors
     * @param string|null $message
     * @param int $code
     *
     * @return JsonResponse
     */
    public function sendErrorResponse($errors, $message = null, $code = 422)
    {
        return Response::json([
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }

    /**
     * @param string $error
     * @param int $code
     *
     * @return JsonResponse
     */
    public function sendError($error, $code = 500)
    {
        return Response::json([
            'success' => false,
            'message' => $error,
        ], $code);
    }

    /**
     * @param string $message
     *
     * @return JsonResponse
     */
    public function sendSuccess($message)
    {
        return Response::json([
            'success' => true,
            'message' => $message,
        ], 200);
    }
}
