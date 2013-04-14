var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    qs = require('querystring');

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};

function getPostData(request, callback) {
    var requestData = '';
    request.on('data', function(chunk) {
        requestData += chunk;
    });
    request.on('end', function(chunk) {
        callback(qs.parse(requestData));
    });
}

var DataSource = function (onDataReceive) {
    this.onDataReceive = onDataReceive;

    var initialData = this.genInitialData();

    if (typeof onDataReceive == 'function') {
        onDataReceive(initialData);
    }
    this.tick();
};

function addSeconds(data, seconds) {
    return new Date(data.valueOf() + seconds * 1000);
}

function genNextValue(prevValue) {
    return prevValue * (1 + (Math.random() - 0.3) / 10)
}

DataSource.prototype = {
    tick: function() {
        var self = this;

        this.timeoutHandler = setTimeout(function() {
            self.onTick();
            self.tick();
        }, 1000);
    },

    onTick: function() {
        this.removeFirstDataItem();

        var nextValue = this.genNextValue();

        if (typeof this.onDataReceive == 'function') {
            this.onDataReceive([nextValue]);
        }
    },

    genNextValue: function() {
        var newData = {
            datetime: (new Date),
            value: genNextValue(this.getLastDataItem().value)
        };

        this.data.push(newData);

        return newData;
    },

    removeFirstDataItem: function() {
        this.data.shift();
    },

    genInitialData: function() {
        var now = new Date;

        this.data = [
          {datetime: addSeconds(now, -50), value: 42}
        ];

        for (var i = -49; i < 1; i++) {
            this.data.push({
                datetime: addSeconds(now, i),
                value: genNextValue(this.getLastDataItem().value)
            });
        }

        return this.data;
    },

    getLastDataItem: function() {
        return this.data[this.data.length - 1];
    },

    getDataSince: function(date) {
        var result = [];

        for (var i = 0; i < this.data.length; i++) {
            var dataItem = this.data[i];

            if (dataItem.datetime > date) {
                result.push({
                    datetime: +dataItem.datetime.valueOf(),
                    value: +dataItem.value
                });
            }
        }

        return result;
    }
};

var dataSource = new DataSource;

var controller = {
    '/statistic': function(request, response) {
        getPostData(request, function(postData) {
            var lastDateTimestamp = (postData && +postData.lastDate) || 0;

            response.writeHead(200, {
                "Content-Type": "application/json"
            });

            response.write(JSON.stringify({
                data: dataSource.getDataSince(new Date(lastDateTimestamp))
            }));

            response.end();
        });
    }
}


http.createServer(function(request, response) {
    if (request.url in controller) {
        return controller[request.url](request, response);
    }

    var uri = url.parse(request.url).pathname;

    if (uri == '/') {
        uri = 'index.html';
    }

    var filename = path.join(process.cwd(), 'public', uri);
    fs.stat(filename, function(error, stats) {
        if (error || stats.isDirectory()) {
            console.log("not exists: " + filename);
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.write('404 Not Found\n');
            response.end();
        } else {
            var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
            response.writeHead(200, {
                'Content-Type': mimeType
            });

            var fileStream = fs.createReadStream(filename);
            fileStream.pipe(response);
        }
    });
}).listen(8888);
