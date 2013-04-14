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
            var point = new Point(self, this.datetime, this.value);
            min = Math.min(this.value, min);
            max = Math.max(this.value, max);
            forRender.push(point);
        });

        this.updateScale(min, max);
        $.each(forRender, function() {
            self.renderPoint(this);        
        });
        this.points = this.points.concat(forRender);
        if ( this.isLoading() ) {
            this.stopLoading();
        }
    },

    /**
     * Add point to chart
     */
    renderPoint: function(point) {
        var bot = this.o.bot + 20;
        if ( this.lastPoint ) {
            var x = this.lastPoint.pos().x + this.o.step;
            point.render(this, x, this.getPointY(point), bot, this.lastPoint);
        }
        else {
            point.render(this, this.o.scaleWidth + 1, this.getPointY(point), bot);
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

    /**
     * Recalculate scale borders
     * 
     * @arg min Number
     * @arg max Number
     */
    calcScale: function(min, max) {
        this.min = Math.min(this.min, min);
        this.max = Math.max(this.max, max);
        var gap = (this.max - this.min) * 0.05;
        this.minDisplay = this.min - gap;
        this.maxDisplay = this.max + gap;
        this.scaleHeight = this.maxDisplay - this.minDisplay;        
    },

    getPointY: function(point) {
        var h = this.o.bot,
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
            top = this.o.height * 0.03,
            bot = this.o.bot,
            sw = this.o.scaleWidth,
            vert = this.line({ x: sw, y: top },
                             { x: sw, y: bot }),
            horiz = this.line({ x: sw, y: bot },
                             { x: this.o.width, y: bot }),
            vertStep = (bot - top) / 10,
            vertValueStep = this.scaleHeight / 10; 
        
        for(var i = 0; i <= 10; i++) {
            var l = this.line({ x: sw - 5, y: bot - i*vertStep },
                              { x: sw, y: bot - i*vertStep }),
                t = this.paper.text(sw - this.o.scaleWidth/2 - 5, 
                                bot - i*vertStep, 
                                (this.minDisplay + i * vertValueStep).toFixed(2));
            el.push(l, t);
        }
        
        for(var i = 0; i <= this.o.count; i++) {
            var l = this.line({ x: sw + i*this.o.step, y: bot },
                              { x: sw + i*this.o.step, y: bot + 3 });
            el.push(l);
        }
        el.push(vert, horiz);
        return el;
    },

    updatePointsPosition: function() {
        var self = this;
        $.each(this.points, function() {
            this.move(this.pos().x, self.getPointY(this));
        });
    },
    
    calcOptions: function(o) {
        o.count = o.count || 60;
        o.scaleWidth = Math.max(o.width * 0.05, 40);
        o.step = (o.width - o.scaleWidth - 10) / o.count;
        o.bot = o.height - Math.max(o.height*0.04, 40);
        this.o = o;
    }
};

var Point = function(chart, datetime, value) {
    this.datetime = datetime;
    this.value = value;
    this.chart = chart;
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
    
    /**
     * Render point on chart
     * 
     * @arg c Chart Chart object
     * @arg x Number
     * @arg y Number
     * @arg labelY Number Y-cordinate of label
     * @arg prev Point Previous point on chart
     */
    render: function(c, x, y, labelY, prev) {
        var p = c.paper;
        this.setPos(x, y);
        this.pointEl = p.set();
        
        var e = this.circle = p.circle(x, y, 1);
        e.attr({'stroke-width': 3, 'fill': '#000' });
        e.attr('fill', '#000');
        e.hover($.proxy(this.onHover, this));
        e.mouseout($.proxy(this.onOut, this));
        
        if ( prev ) {
            this.prev = prev;
            var line = c.line(prev.pos(), this.pos());
            this.line = line;
        }

        var l = this.label = p.text(x, labelY, this.formatTime(this.datetime));
        l.transform('r90');
        
        this.pointEl.push(e, l);
        this.origin = { x: x, y: y };
        return this.pointEl;
    },

    move: function(x, y) {
        var dx = this.origin.x - x,
            dy = this.origin.y - y;
        this.circle.animate({ 'transform': 't' + dx + ',' + dy }, 100);
        if ( this.line ) {
            this.line.remove();
            this.line = this.chart.line(this.prev.pos(), this.pos());
        }
    },

    formatTime: function(time) {
        return time.getMinutes() + ':' + time.getSeconds();
    },

    onHover: function() {
        var el = this.circle;
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