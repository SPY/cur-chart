(function(CurChart) {

function transformDataArrayFromServerFormat(data) {
    var result = [];

    for (var i = 0; i < data.length; i++) {
        var item = data[i];

        result.push({
            datetime: new Date(+item.datetime),
            value: item.value
        });
    }

    return result;
}
/*
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

*/

function DataSource(onDataReceive) {
    this.lastDate = 0;
    this.onDataReceive = onDataReceive;

    this.tick();
    this.data = [];
}

DataSource.prototype = {
    tick: function(){
        var self = this;

        setTimeout(function() {
            $.ajax('/statistic', {
                type: 'POST',
                data: {
                    lastDate: self.lastDate
                },
                success: function (response) {
                    var d = response.data;

                    self.lastDate = +d[d.length - 1].datetime;

                    self.onDataReceive && self.onDataReceive(
                        transformDataArrayFromServerFormat(d)
                    );

                    self.tick();
                }
            });
        }, 1000);
    }
}

CurChart.DataSource = DataSource;

})(window.CurChart || (window.CurChart = {}));
