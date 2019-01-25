var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "Validate Page Title|Testing the angular application",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "7e9c312a98412c1ce8c01cb28c165ec1",
        "instanceId": 17212,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:8808/node_modules/toastr/build/toastr.min.css - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1547389412942,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:8808/node_modules/toastr/build/toastr.min.js - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1547389412943,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:8808/node_modules/toastr/build/toastr.min.js - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1547389413181,
                "type": ""
            }
        ],
        "screenShotFile": "00aa003a-0005-0080-002d-00d200ed004f.png",
        "timestamp": 1547389412617,
        "duration": 3708
    },
    {
        "description": "Testing the angular application UI Elements|Testing the angular application",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "7e9c312a98412c1ce8c01cb28c165ec1",
        "instanceId": 17212,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:8808/node_modules/toastr/build/toastr.min.css - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1547389416787,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:8808/node_modules/toastr/build/toastr.min.js - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1547389416789,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:8808/node_modules/toastr/build/toastr.min.js - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1547389416811,
                "type": ""
            }
        ],
        "screenShotFile": "00430003-001b-00a0-00b8-000c00c80005.png",
        "timestamp": 1547389416737,
        "duration": 3369
    },
    {
        "description": "Launch Url Check|Calculator Test",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "7e9c312a98412c1ce8c01cb28c165ec1",
        "instanceId": 17212,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005200e9-00ab-002a-00d6-00fc00240085.png",
        "timestamp": 1547389420342,
        "duration": 609
    },
    {
        "description": "Add 2 numbers|Calculator Test",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "7e9c312a98412c1ce8c01cb28c165ec1",
        "instanceId": 17212,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000600bf-0032-00cf-0030-0017009d004d.png",
        "timestamp": 1547389421167,
        "duration": 357
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "6b2ff4b26a623c48eddd70b961152f70",
        "instanceId": 6620,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Angular could not be found on the page http://newtours.demoaut.com/mercurysignon.php. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page http://newtours.demoaut.com/mercurysignon.php. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\built\\browser.js:720:27)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: Run it(\"Exatrct all values from an array\") in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:6:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:5:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548438499520,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548438499688,
                "type": ""
            }
        ],
        "screenShotFile": "00490016-0072-007f-00e4-000c002e006e.png",
        "timestamp": 1548438496224,
        "duration": 13618
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

