(function(CurChart) {

var Chart = function(canvasSelector, options) {
    var el = $(canvasSelector),
        o = options || {};
    if (!el.size()) {
	throw new Error('Canvas not exist');
    }
    o.width = o.width || el.width();
    o.height = o.height || el.height();
    this.o = o;
    this.paper = Raphael(el.get(0), o.width, o.height);
    this.points = [];
    this.startLoading();
}

Chart.prototype = {
    /**
     * Add data for render on chart
     * 
     * @arg data [{ datetime: Date, value: Number }]
     */
    addData: function(data) {
	var self = this,
        forRender = [],
        min,
        max;

	$.each(data, function() {
	    var point = new Point(this.datetime, this.value);
	    min = Math.min(this.value, min);
	    max = Math.max(this.value, max);
	    self.points.push(point);
	    forRender.push(point);
	});

	this.updateScale(self.min, self.max);
	$.each(forRender, $.proxy(this.renderPoint, this));

	if ( this.isLoading() ) {
	    this.stopLoading();
	}
    },

    /**
     * Add point to chart
     */
    renderPoint: function(point) {
	
    },

    /**
     * Recalc scale of chart
     * 
     * @arg min Number
     * @arg max Number
     */
    updateScale: function(min, max) {
	if ( !this.scale ) {
	    this.scale = new Scale(min, max);
	}
	else {
	    this.scale.update(min, max);
	}
    },

    loadingText: 'Loading...',

    startLoading: function() {
	if ( this.loadingBox ) {
            this.loadingBox.show();	    
	}
	else {
	    this.loadingBox = this.renderLoadingBox(this.paper);
	}

	this.loadingBox.visible = true;
    },

    renderLoadingBox: function(p) {
	var l = this.loadingBox = p.set(),
	    W = 100, H = 30,
	    pos = {
		x: this.o.width/2 - W/2,
		y: this.o.height/2 - H/2,
		width: W,
		height: H
	    },
	    border = p.rect(pos.x, pos.y, pos.width, pos.height, 5),
	    text = p.text(this.o.width/2, this.o.height/2, this.loadingText);
	border.attr({
	    'stroke': '#000',
	    'stroke-width': 2
	});
	l.push(border, text);
        return l;	
    },

    stopLoading: function() {
	if ( !this.loadingBox ) {
	    return;
	}
	this.loadingBox.hide();
	this.loadingBox.visible = false;
    },

    isLoading: function() {
	return !!(this.loadingBox && this.loadingBox.visible);
    }
};

var Point = function(datetime, value) {
    this.datetime = datetime;
    this.value = value;
}

var Scale = function(min, max) {
    this.min = min;
    this.max = max;
}

Scale.prototype = {
    update: function(min, max) {
	this.min = Math.min(this.min, min);
	this.max = Math.max(this.max, max);
    }
};

CurChart.Chart = Chart;
CurChart.Point = Point;
CurChart.Scale = Scale;

})(window.CurChart || (window.CurChart = {}));