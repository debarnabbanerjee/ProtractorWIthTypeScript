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

