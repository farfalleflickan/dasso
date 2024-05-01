<?php
if (session_status() == PHP_SESSION_NONE) {
    session_set_cookie_params(0);
    ini_set('session.gc_maxlifetime', 900);
    session_start();
}
validateSession();

$DEFAULT_USER_CONFIG_TEMPLATE = "config/defaults.json";
$CONFIG_FILE = "config/config.json";

function getDefUserConf($key = NULL, $returnArray = true) {
    global $DEFAULT_USER_CONFIG_TEMPLATE;
    return readJsonFile($DEFAULT_USER_CONFIG_TEMPLATE, $key, $returnArray);
}

function getConf($key = NULL, $returnArray = true) {
    global $CONFIG_FILE;
    return readJsonFile($CONFIG_FILE, $key, $returnArray);
}

function getUserConf($user, $roles, $key, $returnArray = true) {
    if (!file_exists("users/" . $user . ".json")) {
        $data = array_merge(array("background_image" => ""), array("weather_location" => ""));
        $data = array_merge($data, array("weather_data" => array("description"=> "", "icon"=> "","link"=> "","name"=> "","temp"=> "","timestamp"=> 0)));
        $items = array("items" => getDefLinks($user, $roles));
        $data = array_merge($data, $items);
        setUserConf($user, $data);
        return getUserConf($user, $roles, $key, $returnArray);
    }
    return readJsonFile("users/" . $user . ".json", $key, $returnArray);
}

function setUserConf($user, $data) {
    return writeJsonFile("users/" . $user . ".json", $data);
}

function writeJsonFile($filePath, $data) {
    $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return file_put_contents($filePath, $jsonData);
}

function readJsonFile($filePath, $key = NULL, $returnArray = true) {
    if (!file_exists($filePath)) {
        if (substr($filePath, 0, 7) !== "config/") {
            $defData = getDefUserConf($key);
            if (!is_null($key) && isset($defData[$key])) {
                if (!$returnArray) {
                    $defData = $defData[$key];
                } else {
                    $defData = array($key => $defData[$key]);
                }
            }
            if (writeJsonFile($filePath, $defData)) {
                return $defData;
            }
        }
        return array();
    }
    $data = json_decode(file_get_contents($filePath), true);
    if (!is_null($key)) {
        if (!isset($data[$key])) {
            $defData = getDefUserConf($key);
            if (isset($defData[$key])) {
                $data = array_merge($data, $defData[$key]);
                writeJsonFile($filePath, $data);
            } else {
                return $data;
            }
        }
        if (!$returnArray) {
            return $data[$key];
        }
        return array($key => $data[$key]);
    }
    return $data;
}

function getDefLinks($user, $roles) {
    $confRoles = getConf("roles", false);
    $userRoles = array();
    $keyValuePairs = explode(",", $roles);
    foreach ($keyValuePairs as $keyValue) {
        list($key, $value) = explode(":", $keyValue, 2);
        if ($key === "role") {
            if (isset($confRoles[$value])) {
                $userRoles[] = $confRoles[$value];
            }
        }
    }
    $userConf = array();
    foreach ($userRoles as $key) {
        $userConf = array_merge($userConf, getDefUserConf($key, false));
    }
    return $userConf;
}

function getLinks($user, $roles) {
    return getUserConf($user, $roles, "items", false);
}

function isValidUUID($uuid) {
    $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
    return preg_match($pattern, $uuid) === 1;
}

function validateSession() {
    if (!isset($_SESSION['user_id']) || isValidUUID($_SESSION['user_id']) != 1) {
        error_log("Could not validate session!");
        die();
        exit;
    }
}
