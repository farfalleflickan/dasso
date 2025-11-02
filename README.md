# ***DASSO*** - **DA**shboard for your **SSO**

## Description

A small simple dashboard/homepage for your selfhosted services, that integrates well with your SSO service. It is designed aorund [OAuth2-Proxy](https://oauth2-proxy.github.io/oauth2-proxy/).

![Home](https://raw.githubusercontent.com/farfalleflickan/dasso/refs/heads/screenshots/home.png)
![Settings](https://raw.githubusercontent.com/farfalleflickan/dasso/refs/heads/screenshots/settings.png)
![Weather](https://raw.githubusercontent.com/farfalleflickan/dasso/refs/heads/screenshots/weather.png)
![Bookmark](https://raw.githubusercontent.com/farfalleflickan/dasso/refs/heads/screenshots/bookmark.png)

## Getting Started

### Dependencies

* Web server
* PHP
* OAuth2-Proxy

### Installation

To install, simply extract the source code to a folder and point your web server to it!
Remember to configure your SSO URLs & user roles in config/config.json, as well as link defaults in config/default.json.

Example nginx configuration (assuming a working OAuth2-Proxy setup):
```
location /dasso/ {
        # the following 2 lines should point to your oauth2-proxy setup
        auth_request /oauth2/auth;
        error_page 401 =403 /oauth2/sign_in;
        
        #headers for dasso
        auth_request_set $user   $upstream_http_x_auth_request_user;
        auth_request_set $name   $upstream_http_x_auth_request_preferred_username;
        auth_request_set $roles  $upstream_http_x_auth_request_groups;
        add_header Permissions-Policy "geolocation=(self)";
        index index.php;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            include fastcgi.conf;
            include fastcgi_params;
            fastcgi_index index.php;
            fastcgi_param X-ID    $user;
            fastcgi_param X-User  $name;
            fastcgi_param X-Roles $roles;
            try_files $uri =404;
        }

        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
    }
```

## License

This project is licensed under the GNU AGPLv3 License - see the LICENSE.md file for details.

## Acknowledgments

Weather icons are taken from [yuvraaaj/openweathermap-api-icons](https://github.com/yuvraaaj/openweathermap-api-icons).
Default wallpaper is from Ubuntu 16.04 LTS.
