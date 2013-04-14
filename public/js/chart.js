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
        
        if ( data.length > this.o.count ) {
            data.splice(0, data.length - this.o.count);
        }

        $.each(data, function() {
            var point = new CurChart.Point(self, this.datetime, this.value);
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
            point.render(x, this.lastPoint);
        }
        else {
            point.render(this.o.scaleWidth + 1);
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
            this.move(0);
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
        o.count = o.count || 40;
        o.scaleWidth = Math.max(o.width * 0.05, 40);
        o.step = (o.width - o.scaleWidth - 10) / o.count;
        o.bot = o.height - Math.max(o.height*0.04, 40);
        this.o = o;
    }
};

CurChart.Chart = Chart;

})(window.CurChart || (window.CurChart = {}));