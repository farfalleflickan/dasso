<?php

if (session_status() == PHP_SESSION_NONE) {
    session_set_cookie_params(0);
    ini_set('session.gc_maxlifetime', 900);
    session_start();
}
require_once('php/code.php');
validateSession();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = filter_input(INPUT_POST, 'action', FILTER_SANITIZE_STRING);
    if ($action !== null && $action !== false && !empty($action)) {
        switch ($action) {
            case 'upload_wallpaper':
                if (isset($_FILES['files'])) {
                    handleWallpaper($_FILES['files']);
                } else {
                    http_response_code(500);
                }
                break;
            case 'upload_json':
                $jsonData = htmlspecialchars_decode(filter_input(INPUT_POST, 'jsonData', FILTER_SANITIZE_STRING));

                if ($jsonData !== null && $jsonData !== false && !empty($jsonData)) {
                    handleJSON($jsonData);
                } else {
                    http_response_code(500);
                }
                break;
            case 'upload_weather_cache':
                $jsonData = htmlspecialchars_decode(filter_input(INPUT_POST, 'jsonData', FILTER_SANITIZE_STRING));
                if ($jsonData !== null && $jsonData !== false && !empty($jsonData)) {
                    updateWeatherCache($jsonData);
                } else {
                    http_response_code(500);
                }
                break;
            case 'upload_icon':
                if (isset($_FILES['files'])) {
                    handleIcon($_FILES['files']);
                } else {
                    http_response_code(500);
                }
                break;
            case 'reset_user':
                resetUser($_SESSION['user_name']);
                break;
            default:
                http_response_code(500);
                break;
        }
    } else {
        http_response_code(400);
        header("Location: index.php");
        exit;
    }
} else {
    http_response_code(400);
    header("Location: index.php");
    exit;
}

// Function to handle image file upload
function handleWallpaper($file) {
    $fileTmpName = $file['tmp_name'][0];
    $filePath = 'wallpapers/' . basename($file['name'][0]);
    if (move_uploaded_file($fileTmpName, $filePath)) {
        http_response_code(200);
        exit;
    }
    http_response_code(500);
}

function handleIcon($file) {
    $fileTmpName = $file['tmp_name'][0];
    $filePath = 'user_icons/' . basename($file['name'][0]);
    if (move_uploaded_file($fileTmpName, $filePath)) {
        http_response_code(200);
        exit;
    }
    http_response_code(500);
}

function handleJSON($jsonData) {
    $filePath = 'users/' . $_SESSION['user_name'] . ".json";
    if (file_put_contents($filePath, $jsonData)) {
        http_response_code(200);
        exit;
    }
    http_response_code(500);
}

function updateWeatherCache($jsonData) {
    $filePath = 'users/' . $_SESSION['user_name'] . ".json";
    $weatherJSON = file_get_contents($filePath);
    $weatherObj = json_decode($weatherJSON, true);
    $weatherObj['weather_data'] = json_decode($jsonData, true);
    $updatedJSON = json_encode($weatherObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    if (file_put_contents($filePath, $updatedJSON)) {
        http_response_code(200);
        exit;
    }
    http_response_code(500);
}

function resetUser($userName) {
    $filePath = 'users/' . $userName . '.json';
    unlink($filePath);
}
