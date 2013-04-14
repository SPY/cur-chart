var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};

var DataSource = function (onDataReceive) {
    this.onDataReceive = onDataReceive;

    this.onDataReceive(this.genInitialData());
    this.tick();
};

function addSeconds(data, seconds) {
    return new Date(data.valueOf() + seconds * 1000);
}

function genNextValue(prevValue) {
    return prevValue * (1 + (Math.random() - 0.5) / 10)
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
        this.onDataReceive([this.genNextValue()]);
    },

    genNextValue: function() {
        var newData = {
            datetime: (new Date),
            value: genNextValue(this.getLastDataItem().value)
        };

        this.data.push(newData);

        return newData;
    },

    removeFirstDataItem: function () {
        this.data.unshift();
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
    }
};

var controller = {
    '/statistic': function(request, response) {
        response.writeHead(200, {
            "Content-Type": "application/json"
        });
        response.write(JSON.stringify(request.body || {}));
        response.end();
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
    /*
    path.exists(filename, function(exists) {
        if(!exists) {
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
    }); //end path.exists
    */
}).listen(8888);
