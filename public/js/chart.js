(function(CurChart) {

var Chart = function(canvasSelector, options) {
    var el = $(canvasSelector),
        o = options || {};
    if (!el.size()) {
        throw new Error('Canvas not exist');
    }
    o.width = o.width || el.width();
    o.height = o.height || el.height();
    this.calcOptions(o);
    window.pap = this.paper = Raphael(el.get(0), o.width, o.height);
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
            point.render(this.paper, this.o.scaleWidth + 1, this.getPointY(point));
            //point.line = this.line({ x: this.o.scaleWidth, y: point.pos().y }, point.pos());
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
        this.calcScale(min, max);
        this.updatePointsPosition();
        this.renderScale();
    },

    calcScale: function(min, max) {
        this.min = Math.min(this.min, min);
        this.max = Math.max(this.max, max);
        var gap = (this.max - this.min) * 0.05;
        this.minDisplay = this.min - gap;
        this.maxDisplay = this.max + gap;
        this.scaleHeight = this.maxDisplay - this.minDisplay;        
    },

    getPointY: function(point) {
        var h = this.o.height,
            diff = point.value - this.minDisplay,
            rate = diff/this.scaleHeight;
        return h - ~~(h * rate);
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
                'L' + t.x + ',' + t.y,
            line = this.paper.path(p);
        line.attr({ 'stroke-width': 2, 'stroke-opacity': 0.5 });
        return line;
    },

    renderScale: function() {
        if ( this.scaleEl ) {
            this.scaleEl.remove();
        }
        var el = this.scaleEl = this.paper.set(),
            vert = this.line({ x: this.o.scaleWidth, y: this.o.height * 0.03 },
                             { x: this.o.scaleWidth, y: this.o.height * 0.97 }),
            horiz = this.line({ x: this.o.scaleWidth, y: this.o.height * 0.97 },
                             { x: this.o.width, y: this.o.height * 0.97 });
        el.push(vert, horiz);
        return el;
    },

    updatePointsPosition: function() {
        
    },
    
    calcOptions: function(o) {
        o.count = o.count || 50;
        o.scaleWidth = Math.min(o.width * 0.05, 25);
        o.step = (o.width - o.scaleWidth - 10) / o.count;
        this.o = o;
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
        var e = this.pointEl = p.circle(x, y, 1);
        e.attr({'stroke-width': 3, 'fill': '#000' });
        e.attr('fill', '#000');
        e.hover($.proxy(this.onHover, this));
        e.mouseout($.proxy(this.onOut, this));
        return this.pointEl;
    },

    onHover: function() {
        var el = this.pointEl;
        el.toFront();
        el.animate({ 'stroke-width': 0, r: 5 }, this.animateTime);
    },

    onOut: function() {
        this.pointEl.animate({ 'stroke-width': 3, r: 1 }, this.animateTime);
    },

    animateTime: 200
};

CurChart.Chart = Chart;
CurChart.Point = Point;

})(window.CurChart || (window.CurChart = {}));