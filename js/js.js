var currentRow, currentWeatherLocation, currentWeatherData, userWallpaper, apiKey_global, startTouchX, startTouchY, isDraggingTouch = false;

function showDynamicWeather(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey_global}&units=metric`;
    fetchWeather(weatherUrl);
}

function showWeatherFromID(city) {
    var weatherUrl = `https://api.openweathermap.org/data/2.5/weather?id=${city}&appid=${apiKey_global}&units=metric`;
    fetchWeather(weatherUrl);
}

async function getLocationNameFromID(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?id=${city}&appid=${apiKey_global}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data && data.name) {
            return data.name;
        } else {
            throw new Error('Location not found');
        }
    } catch (error) {
        console.error('Error fetching location name:', error);
        return null;
    }
}

async function getLocationNameFromPosition() {
    try {
        const position = await getCurrentPosition();
        const {latitude, longitude} = position.coords;
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey_global}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data && data.name) {
            return data.name;
        } else {
            throw new Error('Location not found');
        }
    } catch (error) {
        console.error('Error fetching location name:', error);
        return null;
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

function fetchWeather(url) {
    fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.weather !== undefined) {
                    var locationName = data.name || "Unknown";
                    var weatherDescription = data.weather[0].description;
                    var temperature = data.main.temp;

                    var iconUrl = "img/" + data.weather[0].icon + ".png";
                    var weatherLink = "https://openweathermap.org/city/" + data.id;

                    document.getElementById("weatherlink").href = `${weatherLink}`;
                    document.getElementById("weathericon").innerHTML = `<img src="${iconUrl}" alt="${weatherDescription}" id="weatherimage">`;
                    document.getElementById("weathertext").innerHTML = `${locationName}<br>${temperature} °C`;

                    var weatherCacheObj = {
                        description: weatherDescription,
                        icon: iconUrl,
                        link: weatherLink,
                        name: locationName,
                        temp: temperature,
                        timestamp: Date.now()
                    };
                    uploadStuff(null, weatherCacheObj, 'upload_weather_cache', function (error) {
                        if (error) {
                            console.error(error);
                        } else {
                            currentWeatherData = weatherCacheObj;
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
            });
}

function settingsModalSetup() {
    var modal = document.getElementById("modal");
    var modal1 = document.getElementById("modal1");
    var span = modal1.getElementsByTagName("span")[0];

    modal.style.display = "block";
    modal1.style.display = "block";

    span.onclick = function () {
        modal.style.display = "none";
        modal1.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            modal1.style.display = "none";
        }
    };
}

function setOpenWeatherMapKey(apiKey) {
    apiKey_global = apiKey;
}

function settingsModal(userJson) {
    var data = JSON.parse(userJson);
    settingsModalSetup();

    var tableItems = document.getElementById("modalbody1");
    tableItems.innerHTML = "";
    var tableHead = document.getElementById("modalhead1");
    tableHead.innerHTML = "";
    var items = data.items;
    currentWeatherLocation = data.weather_location;
    userWallpaper = data.background_image;

    var list = document.createElement("ul");
    var li = document.createElement("li");
    li.classList.add("fixedlist");
    li.addEventListener("click", function () {
        addWallpaper();
    });
    li.innerHTML = `<p class="clickable">Change wallpaper</p>`;
    list.appendChild(li);
    li = document.createElement("li");
    li.classList.add("fixedlist");
    li.addEventListener("click", function () {
        changeWeather();
    });
    li.innerHTML = `<p class="clickable">Change weather settings</p>`;
    list.appendChild(li);
    tableHead.appendChild(list);

    list = document.createElement("ul");
    list.id = "sortlist";
    items.forEach((item, index) => {
        var li = document.createElement("li");
        li.classList.add("draggable");
        li.classList.add("draggable_li");
        li.innerHTML = `<div id="iconcol" ><img src="${item.icon}" width="32"></div><div id="btncol" class="clickable"><a href="#" onclick="editItem(this.parentNode.parentNode, '${item.icon}', '${item.name}', '${item.url}')">Edit</a></div>`;
        list.appendChild(li);
    });
    var li = document.createElement("li");
    li.addEventListener("click", function () {
        addItem();
    });
    li.innerHTML = `<div id="iconcol" ><img src="" width="32"></div><p id="btncol" class="clickable"><a>Add new</a></p>`;
    li.classList.add("nodrag");
    li.classList.add("clickable");
    li.classList.add("fixedlist");
    li.id = "newitembtn";
    list.appendChild(li);
    tableItems.appendChild(list);
    slist(document.getElementById("sortlist"));
}

function addWallpaper() {
    switchModal(1, 3);

    var modBody = document.getElementById("modalbody3");
    var modFoot = document.getElementById("modalfoot3");
    modFoot.innerHTML = `<div id="delitem" class="clickable" onclick=""><p>Reset to default</p></div><div id="saveitem" class="clickable" onclick=""><p>Save</p></div>`;
    modFoot.childNodes[0].addEventListener("click", function () {
        userWallpaper = "";
        switchModal(3, 1);
        modBody.innerHTML = "";
        modFoot.innerHTML = "";
    }, {once: true});

    modFoot.childNodes[1].addEventListener("click", function () {
        var uploadInput = document.getElementById("upload-wallpaper");
        var files = uploadInput.files;
        if (files.length !== 1) {
            console.error('Please select one file to upload.');
            return;
        }
        var newFileName = randStr(32) + "." + files[0].name.split('.').pop().toLowerCase();
        var newFile = new File([files[0]], newFileName, {type: files[0].type});

        uploadStuff([newFile], null, 'upload_wallpaper', function (error) {
            if (!error) {
                switchModal(3, 1);
                modBody.innerHTML = "";
                modFoot.innerHTML = "";
                userWallpaper = "wallpapers/" + newFileName;
            } else {
                console.error(error);
            }
        });
    }, {once: true});

    modBody.innerHTML = `<div id="editwallpaper"><input type="file" id="upload-wallpaper" accept="image/*"></div>`;
}

function changeWeather() {
    switchModal(1, 4);
    var modBody = document.getElementById("modalbody4");
    var modFoot = document.getElementById("modalfoot4");
    modFoot.innerHTML = `<div id="chngweather" class="clickable"><p>Save</p></div>`;
    modFoot.childNodes[0].addEventListener("click", async function () {
        switchModal(4, 1);
        var weatherLocation = document.getElementById("new_weather_input").value;
        currentWeatherLocation = weatherLocation;
        if (weatherLocation === "") {
            const position = await getCurrentPosition();
            showDynamicWeather(position);
        } else {
            showWeatherFromID(currentWeatherLocation);
        }
        modBody.innerHTML = "";
        modFoot.innerHTML = "";
    }, {once: true});
    var cityName = "Loading location name...";

    modBody.innerHTML = `<p>Search for your location <a href="https://openweathermap.org" target="_blank" style="text-decoration: underline">here</a>. Once you found your location, copy the numbers in the urls after the "/city/".</p>
    <p>For example, if your URL looks like "https://openweathermap.org/city/3169070", your location ID would be "3169070".</p>
    <p>If left empty, your current location will be used instead of a set one.</p>
    <div id="currweatherdiv">
    <input type="text" id="new_weather_input" value="${currentWeatherLocation}" placeholder="Dynamic location">
    <p id="weatheridtoname">${cityName}</p>
    </div>
    `;

    if (currentWeatherLocation === "") {
        getLocationNameFromPosition()
                .then(name => {
                    cityName = name;
                    document.getElementById("weatheridtoname").textContent = cityName;
                })
                .catch(error => {
                    console.error('Error:', error);
                });
    } else {
        getLocationNameFromID(currentWeatherLocation)
                .then(name => {
                    cityName = name;
                    document.getElementById("weatheridtoname").textContent = cityName;
                })
                .catch(error => {
                    console.error('Error:', error);
                });
    }
}

function saveJSON() {
    var modal = document.getElementById("modal");
    var modal1 = document.getElementById("modal1");
    modal.style.display = "none";
    modal1.style.display = "none";

    var jsonData = {
        background_image: userWallpaper,
        weather_location: currentWeatherLocation,
        weather_data: currentWeatherData,
        items: []
    };

    // Traverse through the list of items
    var listItems = document.querySelectorAll("#sortlist > li");
    listItems.forEach(function (liElement) {
        var editLink = liElement.querySelector("a");
        var itemName = editLink.textContent.trim();
        if (itemName !== 'Add new') {
            var onClkStr = editLink.getAttribute("onclick");
            var regexPattern = /'(.*?)', '(.*?)', '(.*?)'/;
            var matchResult = onClkStr.match(regexPattern);
            var iconSrc = "", itemName = "", itemUrl = "";

            if (matchResult) {
                iconSrc = matchResult[1];
                itemName = matchResult[2];
                itemUrl = matchResult[3];
            } else {
                console.error("saveJSON: no matches when using regex");
            }

            var item = {icon: iconSrc, name: itemName, url: itemUrl};
            jsonData.items.push(item);
        }
    });

    uploadStuff(null, jsonData, 'upload_json', function (error) {
        if (!error) {
            location.reload();
        } else {
            console.error(error);
        }
    });
}

function resetToDefault() {
    if (confirm("Your dash will be reset to default parameters, are you sure you want to proceed?")) {
        uploadStuff(null, null, 'reset_user', function (error) {
            if (!error) {
                location.reload();
            } else {
                console.error(error);
            }
        });
    }
}

function addItem() {
    var list = document.getElementById("sortlist");
    var li = document.createElement("li");
    li.classList.add("draggable");
    li.classList.add("draggable_li");
    li.innerHTML = `<div id="iconcol" ><img src="icons/no-image.png" width="32"></div><div id="btncol" class="clickable"><a href="#" onclick="editItem(this.parentNode.parentNode, '', '', '')">Edit</a></div>`;
    list.insertBefore(li, list.lastElementChild);
    editItem(li, "icons/no-image.png", "", "");
}

function editItem(el, icon, name, url) {
    var changedIcon = false;
    switchModal(1, 2);

    var modBody = document.getElementById("modalbody2");
    var modFoot = document.getElementById("modalfoot2");
    modFoot.innerHTML = `<div id="delitem" class="clickable" onclick=""><p>Delete</p></div><div id="saveitem" class="clickable" onclick=""><p>Save</p></div>`;
    modFoot.childNodes[0].addEventListener("click", function () {
        switchModal(2, 1);
        modBody.innerHTML = "";
        modFoot.innerHTML = "";
        el.parentNode.removeChild(el);
    }, {once: true});

    modFoot.childNodes[1].addEventListener("click", function () {
        switchModal(2, 1);
        var newIconName = icon;
        var files = document.getElementById("upload-icon-img").files;
        if (changedIcon) {
            if (files.length !== 1) {
                console.error('Please select one file to upload.');
                return;
            }
            var newFileName = randStr(32) + "." + files[0].name.split('.').pop().toLowerCase();
            var newFile = new File([files[0]], newFileName, {type: files[0].type});

            uploadStuff([newFile], null, 'upload_icon', function (error) {
                if (!error) {
                    switchModal(3, 1);
                    newIconName = "user_icons/" + newFileName;
                    var newName = document.getElementById("icon_name_input").value;
                    var newURL = document.getElementById("icon_url_input").value;
                    modBody.innerHTML = "";
                    modFoot.innerHTML = "";
                    el.innerHTML = `<div id="iconcol" ><img src="${newIconName}" width="32"></div><div id="btncol" class="clickable"><a href="#" onclick="editItem(this.parentNode.parentNode, '${newIconName}', '${newName}', '${newURL}')">Edit</a></div>`;
                } else {
                    console.error(error);
                }
            });
        } else {
            var newName = document.getElementById("icon_name_input").value;
            var newURL = document.getElementById("icon_url_input").value;
            modBody.innerHTML = "";
            modFoot.innerHTML = "";
            el.innerHTML = `<div id="iconcol" ><img src="${newIconName}" width="32"></div><div id="btncol" class="clickable"><a href="#" onclick="editItem(this.parentNode.parentNode, '${newIconName}', '${newName}', '${newURL}')">Edit</a></div>`;
        }
    }, {once: true});

    modBody.innerHTML = `
    <div class="item-mod">
    <div id="editicondiv">
    <img id="item-mod-img" src="${icon}" alt="Icon">
    <input type="file" id="upload-icon-img" accept="image/*" class="hidden-file-input">
    <label for="upload-icon-img" class="upload-button">Change icon</label>
    </div>
    <div id="edititemdiv">
    <input type="text" id="icon_name_input" value="${name}" placeholder="Label">
    <input type="text" id="icon_url_input" value="${url}"  placeholder="Link">
    </div>
    </div>`;

    document.getElementById("upload-icon-img").addEventListener('change', function () {
        changedIcon = true;
        var output = document.getElementById('item-mod-img');
        var files = document.getElementById("upload-icon-img").files;
        var newFileName = randStr(32) + "." + files[0].name.split('.').pop().toLowerCase();
        var newFile = new File([files[0]], newFileName, {type: files[0].type});

        output.src = URL.createObjectURL(newFile);
        output.onload = function () {
            URL.revokeObjectURL(output.src); // free memory
        };
    });
}

function switchModal(from, to) {
    var modal = document.getElementById("modal");
    var modal1 = document.getElementById("modal" + from);
    var modal2 = document.getElementById("modal" + to);
    var span = modal2.getElementsByTagName("span")[0];

    modal1.style.display = "none";
    modal2.style.display = "block";

    if (from < to) {
        span.onclick = function () {
            modal1.style.display = "block";
            modal2.style.display = "none";
        };

        window.onclick = function (event) {
            if (event.target === modal) {
                modal1.style.display = "block";
                modal2.style.display = "none";
                settingsModalSetup();
            }
        };
    } else {
        settingsModalSetup();
    }
}

function dragover() {
    var e = event;
    e.preventDefault();

    let children = Array.from(e.target.parentNode.parentNode.children);
    if (children.indexOf(e.target.parentNode) > children.indexOf(currentRow.parentNode)) {
        e.target.parentNode.after(currentRow);
    } else {
        e.target.parentNode.before(currentRow);
    }
}

function findClosestElemFromPos(x, y, parent, tag, className) {
    let element = document.elementFromPoint(x, y);

    while (element && element.tagName.toLowerCase() !== parent) {
        const rect = element.getBoundingClientRect();

        if (rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y && element.tagName.toLowerCase() === tag && element.classList.contains(className)) {
            return element; // Found the closest element
        }
        element = element.parentNode;
    }

    return null; // No significant element found
}

function slist(target) {
    target.classList.add("slist");
    let items = target.getElementsByTagName("li"), current = null;

    for (let i of items) {
        if (i.classList.contains("nodrag")) {
            continue;
        }
        i.draggable = true;

        i.ontouchstart = function (event) {
            const touch = event.touches[0];
            startTouchX = touch.clientX;
            startTouchY = touch.clientY;
            isDraggingTouch = false;

            current = i;
            for (let it of items) {
                if (it !== current && !it.classList.contains('nodrag')) {
                    it.classList.add("hint");
                }
            }
        };

        i.ontouchmove = function (event) {
            if (isDraggingTouch) {
                event.preventDefault();
            }
            const touch = event.touches[0];
            current.style.position = 'fixed';
            const currentX = touch.clientX;
            const currentY = touch.clientY;
            const posX = currentX - current.offsetWidth / 2 + 'px';
            const posY = currentY - current.offsetHeight / 2 + 'px';
            current.style.top = posY;
            current.style.left = posX;

            // Calculate distance moved from start position
            const deltaX = Math.abs(currentX - startTouchX);
            const deltaY = Math.abs(currentY - startTouchY);

            // If distance moved exceeds a threshold, consider it a drag
            if (deltaX > 10 || deltaY > 10) {
                isDraggingTouch = true;
            }
        };

        i.ontouchend = function (event) {
            if (isDraggingTouch) {
                event.preventDefault();
                const touch = event.changedTouches[0];
                target.style.touchAction = 'auto';
                for (let it of items) {
                    it.classList.remove("hint");
                    it.classList.remove("active");
                }
                const posY = touch.clientY;
                const posX = touch.clientX;
                current.style.position = '';
                current.style.top = '';
                current.style.left = '';
                var foundElem = findClosestElemFromPos(posX, posY, 'ul', 'li', 'draggable_li');
                if (foundElem !== null) {
                    foundElem.parentNode.insertBefore(current, foundElem);
                }
                i.classList.remove("active");
            }
            isDraggingTouch = false;
        };

        i.ondragstart = e => {
            current = i;
            for (let it of items) {
                if (it !== current && !it.classList.contains('nodrag')) {
                    it.classList.add("hint");
                }
            }
        };

        i.ondragenter = e => {
            if (i !== current && !i.classList.contains('nodrag')) {
                i.classList.add("active");
            }
        };

        i.ondragleave = () => i.classList.remove("active");

        i.ondragend = () => {
            for (let it of items) {
                it.classList.remove("hint");
                it.classList.remove("active");
            }
        };

        i.ondragover = e => e.preventDefault();

        i.ondrop = e => {
            e.preventDefault();
            if (i !== current && !i.classList.contains('nodrag')) {
                let currentpos = 0, droppedpos = 0;
                for (let it = 0; it < items.length; it++) {
                    if (current === items[it]) {
                        currentpos = it;
                    }
                    if (i === items[it]) {
                        droppedpos = it;
                    }
                }
                if (currentpos < droppedpos) {
                    i.parentNode.insertBefore(current, i.nextSibling);
                } else {
                    i.parentNode.insertBefore(current, i);
                }
            }
        };
    }
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.error("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.error("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.error("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.error("An unknown error occurred.");
            break;
    }
}

function uploadStuff(files, json, action, callback) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    formData.append('action', action);
    if (json !== null) {
        formData.append('jsonData', JSON.stringify(json));
    }
    if (files !== null) {
        for (var i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }
    }

    xhr.open('POST', 'upload.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            callback(null);
        } else {
            var errMsg = '';
            if (action === 'upload_wallpaper') {
                errMsg = 'Could not upload wallpaper';
            } else if (action === 'upload_icon') {
                errMsg = 'Could not upload icon';
            } else if (action === 'upload_new_json') {
                errMsg = 'Could not upload new user config';
            } else if (action === 'reset_user') {
                errMsg = 'Could not reset user';
            }
            callback(errMsg);
        }
    };
    xhr.send(formData);
}

function randStr(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;

    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function parseCachedWeather(weatherJSON) {
    var data = JSON.parse(weatherJSON);
    document.getElementById("weatherlink").href = `${data.link}`;
    document.getElementById("weathericon").innerHTML = `<img src="${data.icon}" alt="${data.description}" id="weatherimage">`;
    document.getElementById("weathertext").innerHTML = `${data.name}<br>${data.temp} °C`;
}
