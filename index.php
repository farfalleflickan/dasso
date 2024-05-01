<?php
if (session_status() == PHP_SESSION_ACTIVE) {
    session_destroy();
}
session_set_cookie_params(0);
ini_set('session.gc_maxlifetime', 900);
session_start();

$user_id = filter_input(INPUT_SERVER, 'X-ID', FILTER_SANITIZE_STRING);
$user = filter_input(INPUT_SERVER, 'X-User', FILTER_SANITIZE_STRING);
$roles = filter_input(INPUT_SERVER, 'X-Roles', FILTER_SANITIZE_STRING);

if ($user_id !== false && $user_id !== null && !empty($user_id)) {
    $_SESSION['user_id'] = $user_id;
} else {
    $_SESSION['user_id'] = null;
    error_log("user_id is NULL");
    die();
}
if ($user !== false && $user !== null && !empty($user)) {
    $_SESSION['user_name'] = $user;
} else {
    $_SESSION['user_name'] = null;
    error_log("user_name is NULL");
    die();
}

require_once('php/code.php');

$openweather_apikey = getConf("openweather_apikey", false);
$sso_account_page = getConf("account_link", false);
$sso_logout = getConf("logout_link", false);
$background_image = getConf("background_image", false);
$user_image = getUserConf($user, $roles, "background_image", false);
$user_data = getUserConf($user, $roles, NULL, false);
$user_json = json_encode($user_data);
$user_weather = $user_data["weather_location"];
$user_weather_data = $user_data["weather_data"];
if (array_key_exists("weather_data", $user_data)==false || isset($user_data["weather_data"])==false) {
    error_log(print_r($user_data, true));
}

$update_user_weather = 0;

if ((time() - $user_weather_data["timestamp"]) >= 900) {
    $update_user_weather = 1;
}

if ($user_image !== "") {
    $background_image = $user_image;
}
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>dasso</title>
        <link href="css/css.css" rel="stylesheet" type="text/css">
    </head>
    <body style="background-image: url('<?php echo $background_image; ?>');">
        <script src="js/js.js"></script>
        <div id="header">
            <div id="settings"><a id="settingslink" onclick="settingsModal('<?php echo htmlspecialchars($user_json); ?>')" href="javascript:void(0);"><img src="icons/settings.png" width="32px" alt="Settings" id="settingsicon" class="icon-link"></a></div>
        </div>
        <div id="modal">
            <div id="modal1" class="modalContent modalHidden">
                <span id="close-modal">&times;</span>
                <div id="modalhead1"></div>
                <div id="modalbody1"></div>
                <div id="modalfoot1"><div id="resettodefault" class="clickable" onclick="resetToDefault()"><p>Reset to default</p></div><div id="savechanges" class="clickable" onclick="saveJSON()"><p>Save changes</p></div></div>
            </div>
            <div id="modal2" class="modalContent modalHidden">
                <span id="close-modal">&times;</span>
                <div id="modalbody2"></div>
                <div id="modalfoot2"></div>
            </div>
            <div id="modal3" class="modalContent modalHidden">
                <span id="close-modal">&times;</span>
                <div id="modalbody3"></div>
                <div id="modalfoot3"></div>
            </div>
            <div id="modal4" class="modalContent modalHidden">
                <span id="close-modal">&times;</span>
                <div id="modalbody4"></div>
                <div id="modalfoot4"></div>
            </div>
        </div>

        <div id="weatherinfo"><a href="" target="_blank" id="weatherlink" ><div id="weathericon"></div><div id="weathertext"></div></a></div>
        <div id="links-container"><?php
            $userConf = getLinks($user, $roles);
            foreach ($userConf as $item) {
                $url = $item['url'];
                $icon = $item['icon'];
                $name = $item['name'];
                echo "<a class='icon-link' href='$url' target='_blank'><img src='$icon' alt='$name'></a>";
            }
            ?></div>
        <div id="footer">
            <a class='icon-link' id="logout" href='<?php echo $sso_logout ?>'><img src="icons/logout.png" width="32px" alt="Log out" id="logicon" class="icon-link"></a>
            <a class='icon-link' id="account" href='<?php echo $sso_account_page ?>' target="_blank"><img src="icons/account.png" width="32px" alt="Account" id="usericon" class="icon-link"></a>
        </div>
        <script>
            window.onload = function () {
                setOpenWeatherMapKey("<?php echo $openweather_apikey; ?>");
                var weatherlocation = "<?php echo $user_weather; ?>";
                var updateWeather = <?php echo $update_user_weather; ?>;
                
                if (updateWeather === 1) {
                    if (weatherlocation === "") { // dynamic weather...
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(position => showDynamicWeather(position), showError);
                        } else {
                            console.error("Geolocation is not supported by this browser.");
                        }
                    } else {
                        showWeatherFromID(weatherlocation);
                    }
                } else {
                    parseCachedWeather('<?php echo json_encode($user_weather_data); ?>');
                }
            };
        </script>
    </body>
</html>
