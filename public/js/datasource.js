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

function getDataFromServer(lastDateTimestamp, callback) {
    $.ajax('/statistic', {
        type: 'POST',
        data: {
            lastDate: lastDateTimestamp
        },
        success: function (response) {
            callback(response);
        }
    });
}

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
            self.tick();
            getDataFromServer(self.lastDate, function (response) {
                var d = response.data;

                self.lastDate = +d[d.length - 1].datetime;

                self.onDataReceive && self.onDataReceive(
                    transformDataArrayFromServerFormat(d)
                );

            });
        }, 1000);
    }
}

CurChart.DataSource = DataSource;

})(window.CurChart || (window.CurChart = {}));
