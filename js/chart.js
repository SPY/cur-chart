(function(CurChart) {

var Chart = function(canvasSelector, options) {
    var el = $(canvasSelector),
        o = options || {};
    if (!el.size()) {
        throw new Error('Canvas not exist');
    }
    o.width = o.width || el.width();
    o.height = o.height || el.height();
    o.count = o.count || 25;
    o.step = o.width / o.count;
    this.o = o;
    this.paper = Raphael(el.get(0), o.width, o.height);
    this.points = [];
    this.startLoading();
    this.max = 0;
    this.min = Infinity;
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
            min = Infinity,
            max = 0;

        $.each(data, function() {
            var point = new Point(this.datetime, this.value);
            min = Math.min(this.value, min);
            max = Math.max(this.value, max);
            self.points.push(point);
            forRender.push(point);
        });

        this.updateScale(min, max);
        $.each(forRender, function() {
            self.renderPoint(this);        
        });

        if ( this.isLoading() ) {
            this.stopLoading();
        }
    },

    /**
     * Add point to chart
     */
    renderPoint: function(point) {
	if ( this.lastPoint ) {
	    var x = this.lastPoint.pos().x + this.o.step;
	    point.render(this.paper, x, this.getPointY(point));
            point.line = this.line(this.lastPoint.pos(), point.pos());
	}
	else {
	    point.render(this.paper, this.o.step, this.getPointY(point));
	    point.line = this.line({ x: 0, y: point.pos().y }, point.pos());
	}
	this.lastPoint = point;
    },

    /**
     * Recalc scale of chart
     * 
     * @arg min Number
     * @arg max Number
     */
    updateScale: function(min, max) {
        this.min = Math.min(this.min, min);
        this.max = Math.max(this.max, max);
        var gap = (this.max - this.min) * 0.05;
        this.minDisplay = this.min - gap;
        this.maxDisplay = this.max - gap;
	this.scaleHeight = this.maxDisplay - this.minDisplay;
    },

    getPointY: function(point) {
        var h = this.o.height,
	    diff = point.value - this.minDisplay,
	    rate = diff/this.scaleHeight;
	return ~~(h * rate);
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

    stopLoading: function() {
        if ( !this.loadingBox ) {
            return;
        }
        this.loadingBox.hide();
        this.loadingBox.visible = false;
    },

    isLoading: function() {
        return !!(this.loadingBox && this.loadingBox.visible);
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

    line: function(f, t) {
	var p = 'M' + f.x + ',' + f.y +
	        'L' + t.y + ',' + t.y,
	    line = this.paper.path(p);
	line.attr('stroke-width', 2);
	return line;
    }
};

var Point = function(datetime, value) {
    this.datetime = datetime;
    this.value = value;
}

Point.prototype = {
    pos: function() {
	return $.extend({}, this.position);
    },
    
    setPos: function(x, y) {
	this.position = {
	    x: x,
	    y: y
	};
    },

    render: function(p, x, y) {
	this.setPos(x, y);
	this.pointEl = p.circle(x, y, 1);
	this.pointEl.attr('stroke-width', 2);
	return this.pointEl;
    }
};

CurChart.Chart = Chart;
CurChart.Point = Point;

})(window.CurChart || (window.CurChart = {}));