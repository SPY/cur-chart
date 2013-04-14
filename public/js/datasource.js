(function(CurChart) {

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

CurChart.DataSource = DataSource;

$.ajax('/statistic', {
    type: 'POST',
    data: {
        lastDate: (new Date).valueOf() - 5000
    },
    success: function () {
        console.log( 'ajax', arguments );
    }
});

})(window.CurChart || (window.CurChart = {}));
