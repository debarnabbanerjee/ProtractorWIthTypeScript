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
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "77f3a4f24e44d11583d2901328501524",
        "instanceId": 15428,
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
                "timestamp": 1548439395163,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439395334,
                "type": ""
            }
        ],
        "screenShotFile": "008000b7-0011-00f1-00ce-0000008400d2.png",
        "timestamp": 1548439394213,
        "duration": 11442
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "06ec4a6ddcd0546ac6772194bc96d149",
        "instanceId": 12028,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: protractor_1.browser.waitForAngularEnables is not a function"
        ],
        "trace": [
            "TypeError: protractor_1.browser.waitForAngularEnables is not a function\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:9:30)\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Exatrct all values from an array\") in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:6:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:5:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00230061-00d8-00fd-007f-00b2003700ca.png",
        "timestamp": 1548439476457,
        "duration": 19
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "a025503ce70ca3a05d0213d88d6d4124",
        "instanceId": 13496,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548439606153,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439606372,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439606547,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439610602,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439613404,
                "type": ""
            }
        ],
        "screenShotFile": "00a2005a-009d-00af-004b-00940038003c.png",
        "timestamp": 1548439605532,
        "duration": 12074
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "3dd0b81fe11f29fb720d380a5b76d9ee",
        "instanceId": 5696,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548439812463,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439812696,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439812707,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439816779,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548439819181,
                "type": ""
            }
        ],
        "screenShotFile": "0003003c-00a5-0024-00cd-00ab00bf0026.png",
        "timestamp": 1548439811814,
        "duration": 11602
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "94ce25e375c49c697235306b294e904f",
        "instanceId": 8992,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548442570150,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442570428,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442570436,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442574448,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442576551,
                "type": ""
            }
        ],
        "screenShotFile": "000a00c8-00ad-0046-00d2-005c005f0042.png",
        "timestamp": 1548442580586,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "98e28b80950f8d1815d1882de0879380",
        "instanceId": 14376,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548442610824,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442611107,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442611116,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442615127,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442617228,
                "type": ""
            }
        ],
        "screenShotFile": "006e0055-008a-005c-0099-00b5000b00db.png",
        "timestamp": 1548442621276,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "771988d68e33726df2abaff7dbe3b7ff",
        "instanceId": 9380,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548442710875,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442711137,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442711143,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442715156,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442717244,
                "type": ""
            }
        ],
        "screenShotFile": "00090075-00eb-0034-00df-00ff00fd00ae.png",
        "timestamp": 1548442721304,
        "duration": 3
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "98e24edb43b590d58fdad826f66a7a6e",
        "instanceId": 15068,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548442814656,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442814871,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442814877,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442818889,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442821169,
                "type": ""
            }
        ],
        "screenShotFile": "00f1005c-004b-009b-00b4-004400aa00f8.png",
        "timestamp": 1548442825203,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "3f86b2b5778642dadaeda7eda9a8b6b6",
        "instanceId": 7980,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548442912778,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442913051,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442913062,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442917103,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442920233,
                "type": ""
            }
        ],
        "screenShotFile": "007200db-0002-00fd-0097-001c00a300db.png",
        "timestamp": 1548442924266,
        "duration": 3
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "0b63467da123ee05dd96c659df52c049",
        "instanceId": 7116,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548442957109,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442957404,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442957410,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442961424,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548442963524,
                "type": ""
            }
        ],
        "screenShotFile": "00490080-00e1-0097-0043-009e006e008e.png",
        "timestamp": 1548442967627,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "0124cc0779cc219469389d5fb5a09073",
        "instanceId": 4576,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548443177968,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443178230,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443178238,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443182250,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443184340,
                "type": ""
            }
        ],
        "screenShotFile": "003e00e7-00d9-00ef-006a-009c0020000f.png",
        "timestamp": 1548443194389,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4cc993976b2cfae4b1ce71c7ce77de3f",
        "instanceId": 15516,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548443362254,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443362466,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443362479,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443366500,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443368792,
                "type": ""
            }
        ],
        "screenShotFile": "00560037-00c7-00a0-009b-005d00be00e1.png",
        "timestamp": 1548443372897,
        "duration": 9
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "855a312339913702cedbccf0d84c5632",
        "instanceId": 13160,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548443457940,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443458159,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443458173,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443462198,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443464495,
                "type": ""
            }
        ],
        "screenShotFile": "007200b8-003e-003d-0025-005d005700c9.png",
        "timestamp": 1548443468955,
        "duration": 9
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "1fd703b4ec3ff8ebb1323ef0ff002ad9",
        "instanceId": 10108,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548443560746,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443560892,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443560911,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443564935,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443567208,
                "type": ""
            }
        ],
        "screenShotFile": "0033006d-008a-00dc-003f-002a00970056.png",
        "timestamp": 1548443571649,
        "duration": 5
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "cad7ee1942c838660a0d4833e5e4beee",
        "instanceId": 16356,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548443634575,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443634761,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443634935,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443638968,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548443641263,
                "type": ""
            }
        ],
        "screenShotFile": "0019002b-001a-001e-0085-005800f70015.png",
        "timestamp": 1548443645711,
        "duration": 5
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "ec2dbb99924583dfcb1c2296406bb9a4",
        "instanceId": 14888,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548445470119,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445470379,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445470390,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445474403,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445477302,
                "type": ""
            }
        ],
        "screenShotFile": "00360083-0069-00aa-0084-008800780074.png",
        "timestamp": 1548445481544,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e8992f754c30e927518c9be5aaadd658",
        "instanceId": 14592,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548445618086,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445618351,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445618360,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445622374,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445624499,
                "type": ""
            }
        ],
        "screenShotFile": "006a0008-0061-0084-005f-009000f6003e.png",
        "timestamp": 1548445628725,
        "duration": 4
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d882cebabb48b739dfa9af75eab7d540",
        "instanceId": 16436,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548445781082,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445781290,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445781301,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445785313,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548445787390,
                "type": ""
            }
        ],
        "screenShotFile": "003900fb-003e-00de-0099-000400540020.png",
        "timestamp": 1548445791620,
        "duration": 1
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "482b6d05a4cc569f3cc714575910a475",
        "instanceId": 12380,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548446252272,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446252478,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446252491,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446256507,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446258608,
                "type": ""
            }
        ],
        "screenShotFile": "00c600d5-00a5-00a4-0090-0084003f000b.png",
        "timestamp": 1548446262831,
        "duration": 4
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "2b2ec898a0a08cd5372f2ba4ae182e56",
        "instanceId": 11616,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548446631699,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446631925,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446631945,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446635962,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446638078,
                "type": ""
            }
        ],
        "screenShotFile": "004d000a-00d5-0085-0045-007300900030.png",
        "timestamp": 1548446642307,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "ab8b6b04f3e4db0c5198a23237eaa3db",
        "instanceId": 2124,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548446791536,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446791732,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446791744,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446795760,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548446797855,
                "type": ""
            }
        ],
        "screenShotFile": "002300b5-00dc-001a-00d1-00a900a60014.png",
        "timestamp": 1548446802069,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an array|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "c7ad542dccbd0dd27e09474beca5a02b",
        "instanceId": 17848,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548447837462,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548447837742,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548447837750,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548447841757,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548447843851,
                "type": ""
            }
        ],
        "screenShotFile": "00cd00ac-009b-0040-00f3-00980008007d.png",
        "timestamp": 1548447848067,
        "duration": 2
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "b76991a4f34fb7f02dbe017b9998bf25",
        "instanceId": 11976,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548448718672,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448718920,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448718927,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448724941,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448732461,
                "type": ""
            }
        ],
        "screenShotFile": "000900e9-0008-008e-00f6-0077004600a8.png",
        "timestamp": 1548448722935,
        "duration": 11742
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "a8b6464e4bf552cbecf080bd494cd3b6",
        "instanceId": 18392,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548448850136,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448850410,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448850416,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448856443,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448858734,
                "type": ""
            }
        ],
        "screenShotFile": "004c0001-00b1-0068-0015-007f0099003a.png",
        "timestamp": 1548448854427,
        "duration": 6530
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "5e48f5669bf195133c1c04494acc6557",
        "instanceId": 9196,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548448918112,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448918392,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448918400,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448924414,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548448926510,
                "type": ""
            }
        ],
        "screenShotFile": "001800d5-009a-00ee-00de-00a0005f00ce.png",
        "timestamp": 1548448922406,
        "duration": 6332
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "ffe42ea11d3a34c6f392495cb42b6d82",
        "instanceId": 14444,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548449046606,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548449046890,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548449046897,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548449050914,
                "type": ""
            }
        ],
        "screenShotFile": "00030011-00e3-00a1-0063-00be005b0035.png",
        "timestamp": 1548449050907,
        "duration": 23
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "2f3e612c325c4f69a563c23fdaf9714e",
        "instanceId": 7116,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548449113099,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548449113302,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548449113322,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548449119342,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548449121444,
                "type": ""
            }
        ],
        "screenShotFile": "008300e0-0067-0055-000d-00ae000d009e.png",
        "timestamp": 1548449117334,
        "duration": 6351
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4ef3e778a3cb9374cdab2d2054fec37e",
        "instanceId": 2644,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548451608614,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451608858,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451608865,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451614882,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451616984,
                "type": ""
            }
        ],
        "screenShotFile": "00980014-000e-002e-0075-00df003300d7.png",
        "timestamp": 1548451612871,
        "duration": 6334
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "0d8be55e850e9a66c994c90362789115",
        "instanceId": 236,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548451660287,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451660563,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451660571,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451666586,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451669868,
                "type": ""
            }
        ],
        "screenShotFile": "00000011-0058-0041-00bc-00d4006900a5.png",
        "timestamp": 1548451664579,
        "duration": 7526
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "1b9f81c0f8364a957bf4e8dd0c59e87a",
        "instanceId": 11656,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548451851944,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451852215,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451852224,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451856236,
                "type": ""
            }
        ],
        "screenShotFile": "00610007-009a-000b-0065-009b00c9001d.png",
        "timestamp": 1548451856230,
        "duration": 23
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "5c307d609025afec037bb4348a15c74c",
        "instanceId": 232,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548451921058,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451921337,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451921351,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451925363,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548451927302,
                "type": ""
            }
        ],
        "screenShotFile": "0060009c-0066-00b6-00a9-0008007a007d.png",
        "timestamp": 1548451923357,
        "duration": 6167
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "498ce0b8ab564b1d425bac65f43a7511",
        "instanceId": 11292,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548452406334,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548452406611,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548452406620,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548452410637,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548452412887,
                "type": ""
            }
        ],
        "screenShotFile": "00a1003c-00e1-009d-00e4-003a00e90040.png",
        "timestamp": 1548452408626,
        "duration": 6493
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "3a23a39c8d788d32a5aef911475f1b6f",
        "instanceId": 1984,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:482:11)\n    at tryOnTimeout (timers.js:317:5)\n    at Timer.listOnTimeout (timers.js:277:5)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:482:11)\n    at tryOnTimeout (timers.js:317:5)\n    at Timer.listOnTimeout (timers.js:277:5)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548489361473,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548489361679,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548489361687,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548489365759,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://newtours.demoaut.com/mercurysignon.php - This page includes a password or credit card input in a non-secure context. A warning has been added to the URL bar. For more information, see https://goo.gl/zmWq3m.",
                "timestamp": 1548489440115,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/images/spacer.gif - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548489440273,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://newtours.demoaut.com/black - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1548489440445,
                "type": ""
            }
        ],
        "screenShotFile": "00ee0086-007e-0038-00a1-00ae006c004a.png",
        "timestamp": 1548489363730,
        "duration": 60042
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "c8db206a73e609f611a7d2ff153683b5",
        "instanceId": 13992,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //input[@name='userName'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //input[@name='userName'])\n    at elementArrayFinder.getWebElements.then (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\built\\element.js:831:22)\n    at landingPage.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\pages\\landingpage\\landing-page.po.js:61:98)\n    at step (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\pages\\landingpage\\landing-page.po.js:42:23)\n    at Object.next (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\pages\\landingpage\\landing-page.po.js:23:53)\n    at F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\pages\\landingpage\\landing-page.po.js:17:71\n    at new Promise (<anonymous>)\n    at __awaiter (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\pages\\landingpage\\landing-page.po.js:13:12)\n    at landingPage.loginAndgetAllUsageCategoriesDropListElements (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\pages\\landingpage\\landing-page.po.js:56:16)\nFrom: Task: Run it(\"Exatrct all values from an departure list\") in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:22:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorTypeScriptNew\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:6:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "003300bf-00dc-0053-005e-00b200470053.png",
        "timestamp": 1548490193678,
        "duration": 2105
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "dcef5bacfae2fd389906685d2ac3ae30",
        "instanceId": 5248,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00b50056-00a9-0002-00dc-00410076008e.png",
        "timestamp": 1548490278453,
        "duration": 2834
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "123cad91e67782e8d217ea5c03ae98db",
        "instanceId": 13232,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0069002c-00a8-0049-001b-009e001700a9.png",
        "timestamp": 1548490332444,
        "duration": 2818
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9b4c971f6cc76316ba0fc02aeb44c3fe",
        "instanceId": 18312,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ed0006-0023-00ae-00ac-00b000b50029.png",
        "timestamp": 1548494236750,
        "duration": 2507
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "28eab6d95e776741188227013fe83276",
        "instanceId": 17144,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e50055-002a-005c-0036-004f00e70036.png",
        "timestamp": 1548494320417,
        "duration": 2558
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "7142c6a347da481b533b2f50cd251d88",
        "instanceId": 13656,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "007100ac-0022-00f2-0059-00f400d30096.png",
        "timestamp": 1548494361141,
        "duration": 2579
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "a9ad9c98c4d3900ff9c00d260294c1e6",
        "instanceId": 4328,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ec0059-002a-001d-0099-00b000f000a1.png",
        "timestamp": 1548494440058,
        "duration": 2519
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "a1ca435c4d8a623a6ec8c62e71bb18a2",
        "instanceId": 4320,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "001c00bf-0042-00ee-00d3-003a0005009d.png",
        "timestamp": 1548494487106,
        "duration": 2045
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "25b497af2b4f176b4e4a112eee586013",
        "instanceId": 4596,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00100062-0092-00f8-0097-0081008a00bc.png",
        "timestamp": 1548494520407,
        "duration": 2645
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "c0625d1a71c2a415a2e085395dde8ea8",
        "instanceId": 16760,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00cc0015-00fc-0040-00a3-009b009300d7.png",
        "timestamp": 1548494551136,
        "duration": 3107
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "74989f074183cdea9d47b9335d2810d2",
        "instanceId": 12300,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00730036-0010-009f-0008-003700ad0049.png",
        "timestamp": 1548494798510,
        "duration": 3037
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "6c37534619d841cd0d4a26514ae650b8",
        "instanceId": 2804,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00a300e4-0076-00ab-000a-007c00bd0025.png",
        "timestamp": 1548494849620,
        "duration": 3073
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "7656cc9d2f65992c385b02ba5ce5f048",
        "instanceId": 6852,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "001d0071-0000-00e0-001b-009c00e400cc.png",
        "timestamp": 1548496061340,
        "duration": 6079
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9043c35e54fd0083addc2ff0341387a6",
        "instanceId": 7136,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00f5001c-00d8-0053-007b-00ed0063007b.png",
        "timestamp": 1548496117263,
        "duration": 3028
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "40ede12c55213d377b80582a8f1b20b0",
        "instanceId": 11484,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "006700f1-00cd-002f-001d-008f000b006c.png",
        "timestamp": 1548496191302,
        "duration": 3054
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d2ce7105e479b459cfbc1a59f402475b",
        "instanceId": 4276,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0058008f-007c-00f9-0051-005c00af00db.png",
        "timestamp": 1548497830458,
        "duration": 3106
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "991ad3bb8fb35dfcf34cf709413200dd",
        "instanceId": 3300,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "009000d7-0075-00a5-0086-00d000560051.png",
        "timestamp": 1548497979323,
        "duration": 9208
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "1028dd901bd0e2c2ebf9f82ddb82fb4b",
        "instanceId": 7784,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000500ec-004d-00f0-00bb-00cb001c00e2.png",
        "timestamp": 1548498200458,
        "duration": 3046
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "401855b13fa5f43b1c1ef0a22e565cd6",
        "instanceId": 15240,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008f0066-001d-001e-00b5-001500e700d7.png",
        "timestamp": 1548498239818,
        "duration": 3071
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e4b8161694458d832f50a01e22cc006e",
        "instanceId": 14152,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00540085-002a-005c-009c-003c00f2005d.png",
        "timestamp": 1548498488259,
        "duration": 3090
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "98d760b10e14006e737fa1dd46056c17",
        "instanceId": 16120,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00a400fc-00df-000d-0029-002f00150050.png",
        "timestamp": 1548498601434,
        "duration": 3037
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e4446047035e6be5a814d018ca5ead0d",
        "instanceId": 2332,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002b00c4-0068-008b-00c6-003f00540006.png",
        "timestamp": 1548498728199,
        "duration": 3098
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "ae806931b8d135cdebc36ff4ad470663",
        "instanceId": 8092,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00a400d4-003e-00c4-0067-001e004300c2.png",
        "timestamp": 1548498815222,
        "duration": 3190
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "5428d2c94258ce06b1a9bce6a0ca7d1c",
        "instanceId": 15332,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ca00d8-00e6-0016-0092-009400c70088.png",
        "timestamp": 1548498902388,
        "duration": 3013
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "fd0cfda814d725bc28320bea07474631",
        "instanceId": 6428,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0047002b-00e6-00dd-00d7-0085007900d1.png",
        "timestamp": 1548498961010,
        "duration": 3054
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e243037c355b036b07a7a6375ac97ac9",
        "instanceId": 17412,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004800d6-0085-00d7-00dc-00ef0004005e.png",
        "timestamp": 1548499014649,
        "duration": 3039
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "180482e25a21dc657a97d4a7058be739",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005900b1-00cd-00a2-0086-009e00dd00b0.png",
        "timestamp": 1548499094966,
        "duration": 3079
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "5f319e587f49992cfa042edaba6f082f",
        "instanceId": 7648,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004d007b-005a-00bf-00e6-00ec00f700e2.png",
        "timestamp": 1548499154632,
        "duration": 3100
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "c425009f69d1a6b49d38f62206d8d0d2",
        "instanceId": 10160,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "003400b9-00a7-00f7-00ae-009c009d005a.png",
        "timestamp": 1548502714683,
        "duration": 3143
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4a2e64651d6030db1369e7aedfc48bdf",
        "instanceId": 7136,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008a00e0-0055-00b9-0095-001700ed0072.png",
        "timestamp": 1548502761839,
        "duration": 3202
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "dfe5cd57d117f310ab0ba16127423b33",
        "instanceId": 13964,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004e001a-00d1-00b0-00c8-0070007900a8.png",
        "timestamp": 1548502813217,
        "duration": 3136
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "dbca3d2f328883a880da644a54ae2520",
        "instanceId": 8148,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00dd0003-0082-0098-00d7-009900a60053.png",
        "timestamp": 1548502874031,
        "duration": 3222
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "7599d6d21758a91ee2944172f8967c49",
        "instanceId": 18312,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00100079-0061-0041-003a-008b007400ee.png",
        "timestamp": 1548502972804,
        "duration": 3127
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "1ce89e111cca821f0e15927350c22dcf",
        "instanceId": 17812,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00710076-0045-0013-003e-00100052008d.png",
        "timestamp": 1548503046666,
        "duration": 3074
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "f4818ea194acbf227adb110249348844",
        "instanceId": 13516,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00230066-00b2-007d-00b6-006e00d10083.png",
        "timestamp": 1548582127220,
        "duration": 3061
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "eb726ff56cdd7be504f68a1cde9c9b62",
        "instanceId": 5796,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005200fa-00d8-00c0-002a-006f00f80031.png",
        "timestamp": 1548582832318,
        "duration": 3105
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "94ceb7d38244a2289c1a6d91752847a0",
        "instanceId": 13200,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fa0046-0056-0015-002d-00ba002900cc.png",
        "timestamp": 1548582873406,
        "duration": 3036
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9f64c673e9a3afe2a59fcb6e9d75d0b9",
        "instanceId": 18416,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected true to be falsy."
        ],
        "trace": [
            "Error: Failed expectation\n    at F:\\Automation\\ProtractorTypeScriptNew\\outputjs\\specs\\test.js:37:36\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "008f0031-0031-001f-0059-002300c600d9.png",
        "timestamp": 1548582912732,
        "duration": 3034
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "909a6a96c1b6fcfa18cf9702f55dc323",
        "instanceId": 15076,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fc0004-0066-0010-00de-007d007100f8.png",
        "timestamp": 1548582958804,
        "duration": 3001
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "df6923a5ede31ab9bf078439b450e459",
        "instanceId": 2772,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008b0085-00aa-00c6-0034-005a00db002a.png",
        "timestamp": 1548599370883,
        "duration": 2626
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "61777019687816aad45000276513a819",
        "instanceId": 11152,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001500d5-00d8-0011-00dd-00e1004500b6.png",
        "timestamp": 1548599428933,
        "duration": 2517
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "96e5787e95f124c20e580bf7a18640d6",
        "instanceId": 15544,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00640044-009b-00d8-0009-00bb004600aa.png",
        "timestamp": 1548599450815,
        "duration": 2803
    },
    {
        "description": "Validate Page Title|Testing the angular application",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "8da66d5baaae7e47e6361fe2866a41fd",
        "instanceId": 23236,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Angular could not be found on the page http://localhost:8808/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page http://localhost:8808/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\browser.js:720:27)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: Run beforeEach in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\angularApplicationTest.js:7:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\angularApplicationTest.js:5:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "0062001f-0002-0016-00f4-00d800290058.png",
        "timestamp": 1549655764942,
        "duration": 12674
    },
    {
        "description": "Testing the angular application UI Elements|Testing the angular application",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "8da66d5baaae7e47e6361fe2866a41fd",
        "instanceId": 23236,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Angular could not be found on the page http://localhost:8808/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page http://localhost:8808/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\browser.js:720:27)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: Run beforeEach in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\angularApplicationTest.js:7:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\angularApplicationTest.js:5:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "002b00aa-0079-008c-00ba-005100260025.png",
        "timestamp": 1549655778781,
        "duration": 12375
    },
    {
        "description": "Exatrct all values from an departure list|Testing ArrayFUnction",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "8da66d5baaae7e47e6361fe2866a41fd",
        "instanceId": 23236,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00350046-00b2-00d1-0007-003e00c2001e.png",
        "timestamp": 1549655793259,
        "duration": 5501
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "1411fd844dbaa6169db8d3b696cf77ff",
        "instanceId": 28476,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Angular could not be found on the page https://www.personio.de/login/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Angular could not be found on the page https://www.personio.de/login/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\browser.js:720:27)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: Run beforeAll in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at QueueRunner.execute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4199:10)\n    at queueRunnerFactory (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:909:35)\n    at UserContext.fn (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:5325:13)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at QueueRunner.execute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4199:10)\n    at queueRunnerFactory (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:909:35)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:6:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:4:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\browser.js:463:23)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)Error\n    at ElementArrayFinder.applyAction_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:831:22)\n    at LoginPage.enterCompanyName (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\pages\\login\\login-page.po.js:26:26)\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:10:19)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Validate Login\") in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:9:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:4:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00d600c1-0086-0064-0084-00c0002a00de.png",
        "timestamp": 1549819144464,
        "duration": 2020
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "ca4bda261b4a8f5ba3fbee782483b314",
        "instanceId": 20040,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00310080-0077-002e-00c1-001000b700b9.png",
        "timestamp": 1549819288950,
        "duration": 6471
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "da766347c7abc46181c4be8bad38bd86",
        "instanceId": 10980,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "007b0011-002d-0008-00bb-00080048006b.png",
        "timestamp": 1549819378078,
        "duration": 5691
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "5c4864bc3e4a3c3b6adf2be82092ed4b",
        "instanceId": 20752,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: headless chrome=71.0.3578.98)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: headless chrome=71.0.3578.98)\n  (Driver info: chromedriver=2.46.628402 (536cd7adbad73a3783fdc2cab92ab2ba7ec361e1),platform=Windows NT 10.0.17134 x86_64)\n    at Object.checkLegacyResponse (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:831:22)\n    at LoginPage.enterCompanyName (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\pages\\login\\login-page.po.js:26:26)\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:12:19)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Validate Login\") in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:11:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:5:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00fa00e6-0065-0092-00e1-008c005e0036.png",
        "timestamp": 1549819420418,
        "duration": 8092
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "86bfdd804506af0816e4577042e166d5",
        "instanceId": 8624,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0053007b-0071-0030-00bf-003400c000f7.png",
        "timestamp": 1549819474457,
        "duration": 5447
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "711353fd7b5cf936baa792d6d2900081",
        "instanceId": 11836,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://automation-testing.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549820364084,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://automation-testing.personio.de/login/token-auth - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549820370893,
                "type": ""
            }
        ],
        "screenShotFile": "00f1004b-004a-0056-0090-00c2009c007e.png",
        "timestamp": 1549820366079,
        "duration": 5189
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "26fed600f9bef1564210b522f694e888",
        "instanceId": 17228,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://automation-testing.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549820406539,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://automation-testing.personio.de/login/token-auth - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549820413191,
                "type": ""
            }
        ],
        "screenShotFile": "00aa0044-000c-0060-0017-008800880059.png",
        "timestamp": 1549820408316,
        "duration": 20225
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9b9d49c606546e4964c1e0ea5f26eb02",
        "instanceId": 14872,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549914894917,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/token-auth - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549914901391,
                "type": ""
            }
        ],
        "screenShotFile": "00c4005c-009b-00b2-00e0-0005006900c2.png",
        "timestamp": 1549914896517,
        "duration": 20232
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "c40b730665db1e2ca4463dcb6b066f95",
        "instanceId": 15696,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549914991449,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549914997644,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549915013554,
                "type": ""
            }
        ],
        "screenShotFile": "00fd001a-0076-00ef-0073-003900c9002c.png",
        "timestamp": 1549914992840,
        "duration": 20706
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e39853b5846ca519edea984efc5111e2",
        "instanceId": 8624,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549915025304,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549915031596,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549915053589,
                "type": ""
            }
        ],
        "screenShotFile": "00ed00f8-006c-00b5-0094-003900e00022.png",
        "timestamp": 1549915026768,
        "duration": 20785
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "73070b126e6a35fb8cc83297eb996e99",
        "instanceId": 6060,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected Function to be true.",
            "Expected Function to be true.",
            "Expected Function to be true."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:16:56)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:17:54)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:18:57)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916169232,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916175373,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549916178614,
                "type": ""
            }
        ],
        "screenShotFile": "00a700a7-0038-0078-00ad-00f5008f001a.png",
        "timestamp": 1549916170573,
        "duration": 8034
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "77ccf8b3e2f6b208de4aa653cd05ad52",
        "instanceId": 16036,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected Function to be true.",
            "Expected Function to be true.",
            "Expected Function to be true."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:16:56)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:17:54)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:18:57)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916201081,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916207163,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549916209971,
                "type": ""
            }
        ],
        "screenShotFile": "000c00dc-00ec-0025-008c-000f00ff0011.png",
        "timestamp": 1549916202347,
        "duration": 7619
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "3f2947cb15b7531dae23a0bdf052318f",
        "instanceId": 13552,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected Function to be true.",
            "Expected Function to be true.",
            "Expected Function to be true.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:16:56)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:17:54)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:18:57)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:482:11)\n    at tryOnTimeout (timers.js:317:5)\n    at Timer.listOnTimeout (timers.js:277:5)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916304595,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916310663,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549916343334,
                "type": ""
            }
        ],
        "screenShotFile": "006400c4-00a8-008a-003d-005900f80055.png",
        "timestamp": 1549916305928,
        "duration": 31394
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "0795439d7ad625c30f8cc9b50a987f19",
        "instanceId": 13676,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected Function to be true.",
            "Expected Function to be true.",
            "Expected Function to be true.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:16:56)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:17:54)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Failed expectation\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\login-page.js:18:57)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:482:11)\n    at tryOnTimeout (timers.js:317:5)\n    at Timer.listOnTimeout (timers.js:277:5)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916382872,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916389117,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549916415020,
                "type": ""
            }
        ],
        "screenShotFile": "00cc0078-001c-00d3-00ca-00fe00c9000b.png",
        "timestamp": 1549916384308,
        "duration": 30705
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "1d9745762f19dbf17ce509a4b3a8556d",
        "instanceId": 6600,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:482:11)\n    at tryOnTimeout (timers.js:317:5)\n    at Timer.listOnTimeout (timers.js:277:5)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916453901,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916466114,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549916491999,
                "type": ""
            }
        ],
        "screenShotFile": "00ee005d-00cf-00ba-003e-00fc002f0043.png",
        "timestamp": 1549916455314,
        "duration": 36684
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "5bf7869bea35c1b234c8a7372c4cda54",
        "instanceId": 15284,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916525503,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916531551,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549916539390,
                "type": ""
            }
        ],
        "screenShotFile": "00460052-0098-0041-00bb-0025004e0096.png",
        "timestamp": 1549916526823,
        "duration": 12568
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "1cd0044b270549a828e519391495e6e0",
        "instanceId": 13400,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916584690,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549916590855,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549916596663,
                "type": ""
            }
        ],
        "screenShotFile": "00da00b5-00ca-0035-003e-0022009300a8.png",
        "timestamp": 1549916586039,
        "duration": 10626
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "615b2944b9c71a23514684c7db8622f1",
        "instanceId": 10336,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549917128864,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549917135058,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549917140988,
                "type": ""
            }
        ],
        "screenShotFile": "000b0086-00f2-00aa-009e-0058001200b5.png",
        "timestamp": 1549917130273,
        "duration": 10709
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "163716642c70d13b8cf4d320e7d42fab",
        "instanceId": 11220,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549917261962,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549917268131,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549917273994,
                "type": ""
            }
        ],
        "screenShotFile": "000200f7-006c-007b-00ae-007b00bf007e.png",
        "timestamp": 1549917263373,
        "duration": 10619
    },
    {
        "description": "Validate Proper Display of Payroll Page UI Elements|Verify Payroll Tab",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "163716642c70d13b8cf4d320e7d42fab",
        "instanceId": 11220,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549917274156,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1549917279242,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1549917284813,
                "type": ""
            }
        ],
        "screenShotFile": "00ea006f-0035-0061-0071-00e200b80059.png",
        "timestamp": 1549917284812,
        "duration": 1
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9b8096c012603d4ad5870d6219fae7b9",
        "instanceId": 11992,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550003207465,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550003213735,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550003214340,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550003225482,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550003225643,
                "type": ""
            }
        ],
        "screenShotFile": "006d0090-00da-00d3-00d3-00e200920038.png",
        "timestamp": 1550003208910,
        "duration": 10561
    },
    {
        "description": "Validate Proper Display of Payroll Page UI Elements|Verify Payroll Tab",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9b8096c012603d4ad5870d6219fae7b9",
        "instanceId": 11992,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550003230761,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550003231139,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550003236219,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550003236603,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550003236900,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550003238992,
                "type": ""
            }
        ],
        "screenShotFile": "000f00bd-0092-0069-00c9-006100e40095.png",
        "timestamp": 1550003236209,
        "duration": 2777
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e9b6a36872bb1832b7d640b6468eddbe",
        "instanceId": 3788,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004227088,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004230184,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004230737,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004236538,
                "type": ""
            }
        ],
        "screenShotFile": "007b0057-0020-003b-0043-0038008300e4.png",
        "timestamp": 1550004229056,
        "duration": 7473
    },
    {
        "description": "Validate Proper Display of Payroll Page UI Elements|Verify Payroll Tab",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e9b6a36872bb1832b7d640b6468eddbe",
        "instanceId": 3788,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004236681,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004238778,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004239120,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004241193,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004241494,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004241768,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004244413,
                "type": ""
            }
        ],
        "screenShotFile": "00c1005e-00bc-007e-00b9-00ef00cf003c.png",
        "timestamp": 1550004241184,
        "duration": 3223
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "c1e41ee94406cf374454d4294dc64dc0",
        "instanceId": 11580,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004580083,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004582664,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004583237,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004588677,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004588849,
                "type": ""
            }
        ],
        "screenShotFile": "00c800ed-0031-0078-000c-006b001e0010.png",
        "timestamp": 1550004581507,
        "duration": 7173
    },
    {
        "description": "Validate Proper Display of Payroll Page UI Elements|Verify Payroll Tab",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "c1e41ee94406cf374454d4294dc64dc0",
        "instanceId": 11580,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Invalid locator"
        ],
        "trace": [
            "TypeError: Invalid locator\n    at Object.check [as checkedLocator] (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\by.js:275:9)\n    at WebElement.findElements (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2072:18)\n    at parentWebElements.map (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:170:46)\n    at Array.map (<anonymous>)\n    at getWebElements.then (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\built\\element.js:167:65)\n    at ManagedPromise.invokeCallback_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\nFrom: Task: Run it(\"Validate Proper Display of Payroll Page UI Elements\") in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\payroll-tests.js:22:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\payroll-tests.js:9:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004590979,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004591371,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004593453,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004593739,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004594054,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004596175,
                "type": ""
            }
        ],
        "screenShotFile": "00ec0087-000a-0075-0070-00a5001700a7.png",
        "timestamp": 1550004593457,
        "duration": 2859
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e846f46b69d003a51ab47328df95e904",
        "instanceId": 6320,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004931846,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004934461,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004935136,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004940223,
                "type": ""
            }
        ],
        "screenShotFile": "00d000d2-00e2-0036-00ae-009b0036007d.png",
        "timestamp": 1550004933298,
        "duration": 6916
    },
    {
        "description": "Validate Proper Display of Payroll Page UI Elements|Verify Payroll Tab",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "e846f46b69d003a51ab47328df95e904",
        "instanceId": 6320,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Invalid locator"
        ],
        "trace": [
            "TypeError: Invalid locator\n    at Object.check [as checkedLocator] (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\by.js:275:9)\n    at thenableWebDriverProxy.findElements (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\webdriver.js:1041:18)\n    at Function.E2EUtil.validatNumberOfElementsPresent (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\pages\\e2e.utils.js:20:37)\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\payroll-tests.js:36:29)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Validate Proper Display of Payroll Page UI Elements\") in control flow\n    at UserContext.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\payroll-tests.js:22:5)\n    at addSpecsToSuite (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (F:\\Automation\\ProtractorWIthTypeScript\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (F:\\Automation\\ProtractorWIthTypeScript\\outputjs\\specs\\payroll-tests.js:9:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004940354,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550004942304,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550004942676,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550004944766,
                "type": ""
            }
        ],
        "screenShotFile": "00e300ed-0049-00c5-00b8-007c00060012.png",
        "timestamp": 1550004944750,
        "duration": 0
    },
    {
        "description": "Validate Login|Verify Login Test Case",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "f959489aaa3092674ef3bee178d59d54",
        "instanceId": 1048,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550005085246,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550005087883,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550005088404,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550005093637,
                "type": ""
            }
        ],
        "screenShotFile": "00ed0020-005f-007b-0003-00c4004b00b3.png",
        "timestamp": 1550005086652,
        "duration": 6978
    },
    {
        "description": "Validate Proper Display of Payroll Page UI Elements|Verify Payroll Tab",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "f959489aaa3092674ef3bee178d59d54",
        "instanceId": 1048,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/login/index - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550005093810,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550005096184,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550005096600,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/ - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550005098688,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width - Error parsing header X-XSS-Protection: 1; mode=block, 1; mode=block: expected semicolon at character position 13. The default protections will be applied.",
                "timestamp": 1550005099013,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn3.personio.de/build/client/js/app.88db142cda4cc7dd880a.js 0:854661 \"Your Appcues account has expired, but you have not uninstalled Appcues. Please contact us at support@appcues.com.\"",
                "timestamp": 1550005099369,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://candidate-at-personio-debarnab-banerjee.personio.de/payroll-full-width/verification?year=2019&month=02&tab=personal - Access to resource at 'https://cdn3.personio.de/manifest.json' from origin 'https://candidate-at-personio-debarnab-banerjee.personio.de' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1550005101477,
                "type": ""
            }
        ],
        "screenShotFile": "003200db-00f4-0087-00a1-002a00d400b1.png",
        "timestamp": 1550005098679,
        "duration": 2791
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

