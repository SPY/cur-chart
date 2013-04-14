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
        
        var forRemove = Math.max(0, data.length - (this.o.count - this.points.length));

        this.erasePoints(forRemove);
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
            point.render(this, x, this.getPointY(point), this.lastPoint);
        }
        else {
            point.render(this, this.o.scaleWidth + 1, this.getPointY(point));
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

    updatePointsPosition: function() {
        var self = this;
        $.each(this.points, function() {
            this.move(0, -this.pos().y + self.getPointY(this));
        });
    },
    
    erasePoints: function(num) {
        var self = this,
            trash = this.points.splice(0, num),
            min = Infinity, max = 0;
        $.each(trash, function() {
            this.remove();
        });
        $.each(this.points, function() {
           min = Math.min(min, this.value);
           max = Math.max(max, this.value);
           this.move(-(self.o.step * num), 0);
        });
        this.min = min;
        this.max = max;
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
    render: function(c, x, y, prev) {
        var p = c.paper;
        this.setPos(x, y);
        this.pointEl = p.set();
        
        var e = this.renderPoint(p, x, y);
        
        if ( prev ) {
            this.prev = prev;
            var line = c.line(prev.pos(), this.pos());
            this.line = line;
        }

        var l = this.renderLabel(p, x);
        
        this.pointEl.push(e, l);
        return this.pointEl;
    },

    renderPoint: function(p, x, y) {
        var e = this.circle = p.circle(x, y, 1);
        e.attr({'stroke-width': 3, 'fill': '#000' });
        e.attr('fill', '#000');
        e.hover($.proxy(this.onHover, this));
        e.mouseout($.proxy(this.onOut, this));        
        return e;
    },

    renderLabel: function(p, x) {
        var l = this.label = p.text(x, this.chart.o.bot + 20, this.formatTime(this.datetime));
        l.transform('r90');
        return l;        
    },

    move: function(dx, dy) {
        var x = this.position.x + dx,
            y = this.position.y + dy;
        this.circle.remove();
        this.renderPoint(this.chart.paper, x, y);
        this.setPos(x, y);
        if ( this.line ) {
            this.line.remove();
            this.line = this.chart.line(this.prev.pos(), this.pos());
        }
        this.label.remove();
        this.renderLabel(this.chart.paper, x);
    },

    remove: function() {
        this.pointEl.remove();
        this.circle.remove();
        this.line && this.line.remove();
        this.label.remove();
    },

    formatTime: function(time) {
        var m = time.getMinutes(),
            s = time.getSeconds();
        m = m > 9 ? m : '0' + m;
        s = s > 9 ? s : '0' + s;
        return m  + ':' + s;
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