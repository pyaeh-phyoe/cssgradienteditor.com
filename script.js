/*
    ui.anglepicker
*/

$.widget("ui.anglepicker", $.ui.mouse, {
    widgetEventPrefix: "angle",
    _init: function() {
        this._mouseInit();
        this.pointer = $('<div class="ui-anglepicker-pointer"></div>');
        this.pointer.append('<div class="ui-anglepicker-dot"></div>');
        this.pointer.append('<div class="ui-anglepicker-line"></div>');

        this.element.addClass("ui-anglepicker");
        this.element.append(this.pointer);

        this.setDegrees(this.options.value);
    },
    _propagate: function(name, event) {
        this._trigger(name, event, this.ui());
    },
    _create: function() {

    },
    destroy: function() {
        this._mouseDestroy();

        this.element.removeClass("ui-anglepicker");
        this.pointer.remove();
    },
    _mouseCapture: function(event) {
        var myOffset = this.element.offset();
        this.width = this.element.width();
        this.height = this.element.height();

        this.startOffset = {
            x: myOffset.left + (this.width / 2),
            y: myOffset.top + (this.height / 2)
        };

        if (!this.element.is("ui-anglepicker-dragging")) {
            this.setDegreesFromEvent(event);
            this._propagate("change", event);
        }

        return true;
    },
    _mouseStart: function(event) {
        this.element.addClass("ui-anglepicker-dragging");
        this.setDegreesFromEvent(event);
        this._propagate("start", event);
    },
    _mouseStop: function(event) {
        this.element.removeClass("ui-anglepicker-dragging");
        this._propagate("stop", event);
    },
    _mouseDrag: function(event) {
        this.setDegreesFromEvent(event);
        this._propagate("change", event);
    },
    _setOption: function(key, value) {

        this._super(key, value);
    },

    ui: function() {
        return {
            element: this.element,
            value: this.options.value
        };
    },
    value: function(newValue) {

        if (!arguments.length) {
            return this.options.value;
        }

        var oldValue = this.options.value;
        this.setDegrees(newValue);

        if (oldValue !== this.options.value) {
            this._propagate("change");
        }

        return this;
    },
    drawRotation: function() {
        var value = this.options.clockwise ? this.options.value : -this.options.value;
        var rotation = 'rotate(' + -value + 'deg)';

        this.pointer.css({
            '-webkit-transform': rotation,
            '-moz-transform': rotation,
            '-ms-transform': rotation,
            '-o-transform': rotation,
            'transform': rotation
        });
    },
    setDegrees: function(degrees) {
        this.options.value = this.clamp(degrees);
        this.drawRotation();
    },
    clamp: function(degrees) {
        if (typeof degrees !== "number") {
            degrees = parseInt(degrees, 10);
            if (isNaN(degrees)) {
                degrees = 0;
            }
        }

        var min = this.options.min,
            max = min + 360;

        while (degrees < min) {
            degrees += 360;
        }
        while (degrees > max) {
            degrees -= 360;
        }

        return degrees;
    },
    setDegreesFromEvent: function(event) {
        var opposite = this.startOffset.y - event.pageY;
        opposite = this.options.clockwise ? opposite : -opposite;

        var adjacent = event.pageX - this.startOffset.x,
            radians = Math.atan(opposite / adjacent),
            degrees = Math.round(radians * (180 / Math.PI), 10);

        if (event.shiftKey) {
            degrees = this.roundToMultiple(degrees, this.options.shiftSnap);
        } else {
            degrees = this.roundToMultiple(degrees, this.options.snap);
        }

        if (adjacent < 0 && opposite >= 0) {
            degrees += 180;
        } else if (opposite < 0 && adjacent < 0) {
            degrees -= 180;
        }

        this.setDegrees(degrees);
    },
    roundToMultiple: function(number, multiple) {
        var value = number / multiple,
            integer = Math.floor(value),
            rest = value - integer;

        return rest > 0.5 ? (integer + 1) * multiple : integer * multiple;
    },
    options: {
        distance: 1,
        delay: 1,
        snap: 1,
        min: 0,
        shiftSnap: 15,
        value: 90,
        clockwise: true // anti-clockwise if false
    }
});

function UserColor(options) {
    //console.log(options);
    if (options && options['format'] && options['color']) {
        this.format = options['format'];
        this.color = options['color'];

        if (this.format === 'hex' && this.color[0] === '#') {
            this.color = this.color.slice(1);
        }
    } else {
        this.format = 'rgb';
        this.color = { 'r': 46, 'g': 74, 'b': 117 };
    }
}

UserColor.prototype.getAlpha = function() {
    if (this.format[this.format.length - 1] !== 'a') {
        return 1;
    }
    return this.color.a;
};

UserColor.prototype.changeHSLLevels = function(hue, saturation, lightness) {
    var oldFormat = this.format;
    ////console.log(oldFormat);
    if (oldFormat[oldFormat.length - 1] === 'a') {
        this.changeFormatColor('hsla');
        ////console.log('good');
    } else {
        ////console.log('asshole');
        this.changeFormatColor('hsl');
    }
    ////console.log(this.color);

    var h, s, l;
    h = (this.color.h + hue) % 360;
    s = this.color.s * (saturation / 100.0 + 1);
    l = this.color.l * (lightness / 100.0 + 1);

    this.color.h = (h < 0) ? h + 360 : h;
    this.color.s = clamp(Math.round(s), 0, 100);
    this.color.l = clamp(Math.round(l), 0, 100);
    ////console.log(this.color);
    ////console.log(oldFormat);

    this.changeFormatColor(oldFormat);
};

UserColor.prototype.clone = function() {
    var i;
    var c = {};

    if (this.format == 'hex') {
        return new UserColor({ 'format': 'hex', 'color': this.color });
    } else {
        for (i = 0; i < this.format.length; i++)
            c[this.format[i]] = this.color[this.format[i]];

        return new UserColor({ 'format': this.format, 'color': c });
    }
};

UserColor.prototype.changeFormatColor = function(newFormat) {
    //console.log(newFormat);
    var newColor = {};
    if (newFormat == this.format) {
        return this.color;
    }
    //console.log(this.color);

    // From RGB(A) to HSL / HEX
    if (this.format == 'rgb' || this.format == 'rgba') {
        if (newFormat == 'hsl' || newFormat == 'hsla') {
            newColor = rgb2hsl(this.color);
            //if (newFormat == 'hsla' && this.format == 'rgb') {
            //newColor['a'] = 1;//
            //}
        } else if (newFormat == 'hex') {
            newColor = rgb2hex(this.color);
        } else if (newFormat == 'rgb') {
            newColor = _remove_alpha(this.color);
        } else if (newFormat == 'rgba') {
            newColor = this.color;
            //newColor['a'] = 1;
        }
    }

    // From HSL(A) to RGB / HEX
    if (this.format == 'hsl' || this.format == 'hsla') {
        if (newFormat == 'rgb' || newFormat == 'rgba') {
            newColor = hsl2rgb(this.color);
            //if (newFormat == 'rgba' && this.format == 'hsl') {
            //newColor['a'] = 1;//
            //}
        } else if (newFormat == 'hex') {
            newColor = hsl2hex(this.color);
        } else if (newFormat == 'hsl') {
            newColor = _remove_alpha(this.color);
        } else if (newFormat == 'hsla') {
            newColor = this.color;
            //newColor['a'] = 1;//
        }
    }

    // From HEX to RGB / HSL
    if (this.format == 'hex') {
        if (newFormat == 'rgb' || newFormat == 'rgba') {
            newColor = hex2rgb(this.color);
        } else if (newFormat == 'hsl' || newFormat == 'hsla') {
            newColor = hex2hsl(this.color);
        }
        //if (newFormat[newFormat.length - 1] == 'a') {
        //    newColor['a'] = 1;
        //}
    }
    ////console.log(newColor);

    this.format = newFormat;
    this.color = newColor;
};

UserColor.prototype.displayColor = function(format) {
    var res = '';
    var color = this;
    //console.log(format);
    //console.log(this);
    if (format && format != this.format) {
        color = this.clone();
        color.changeFormatColor(format);
    }
    //console.log(color);
    if (color.format != 'hex') {
        res = color.format + '(';
    }

    if (color.format == 'hsl' || color.format == 'hsla') {
        res += color.color['h'] + ',';
        res += parseFloat(color.color['s']) + '%,'; //ngar low bae
        res += parseFloat(color.color['l']) + '%'; //ngar low bae
        //res += color.color['s'] + '%,';//ngar low bae
        //res += color.color['l'] + '%';//ngar low bae
    } else if (color.format == 'rgb' || color.format == 'rgba') {
        res += color.color['r'] + ',';
        res += color.color['g'] + ',';
        res += color.color['b'];
    } else if (color.format == 'hex') {
        res += '#' + color.color;
    }

    if (color.format[color.format.length - 1] == 'a') {
        res += ',' + color.color['a'];
    }

    if (color.format != 'hex') {
        res += ')';
    }
    //console.log(color);
    //console.log(res);
    return res;
};

UserColor.prototype.equals = function(a) {
    var ok = a.format = this.format;
    if (ok && a.format === 'hex') {
        ok = a.color == this.color;
    } else if (ok && a.format.slice(0, 3) == 'rgb') {
        ok = a.color.r == this.color.r;
        ok = ok && a.color.g == this.color.g;
        ok = ok && a.color.b == this.color.b;
    } else if (ok && a.format.slice(0, 3) == 'hsl') {
        ok = a.color.h == this.color.h;
        ok = ok && a.color.s == this.color.s;
        ok = ok && a.color.l == this.color.l;
    }

    if (ok && a.format[a.format.length - 1] == 'a') {
        ok = ok && a.color.a == this.color.a;
    }
    return ok;
};

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 1]
// *Returns:* [h, s, l ] in [0, 1]
function rgb2hsl(rgba) {
    var r = rgba['r'] / 255.0,
        g = rgba['g'] / 255.0,
        b = rgba['b'] / 255.0,
        res = {};

    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    res = {
        'h': clamp(Math.round(h * 360) % 360, 0, 360),
        's': clamp(Math.round(s * 100), 0, 100),
        'l': clamp(Math.round(l * 100), 0, 100)
    };

    if (rgba['a'] || rgba['a'] == 0) {
        res['a'] = rgba['a'];
    }
    ////console.log(res);
    return res;
}

// `hslToRgb
// Converts an HSL color value to RGB.
// *Assumes:* h, s, and l is contained in [0, 1]
// *Returns:* [r, g, b] in the set [0, 255]
function hsl2rgb(hsla) {
    //console.log(hsla);
    var h = hsla['h'] / 360.0,
        s = parseFloat(hsla['s']) / 100.0,
        l = parseFloat(hsla['l']) / 100.0,
        res = {};
    var r, g, b;

    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }
    h = h % 1;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    //console.log(r);
    //console.log(g);
    //console.log(b);

    res = {
        'r': clamp(Math.round(r * 255), 0, 255),
        'g': clamp(Math.round(g * 255), 0, 255),
        'b': clamp(Math.round(b * 255), 0, 255)
    };
    if (hsla['a'] || hsla['a'] == 0) {
        res['a'] = hsla['a'];
    }
    //console.log(res);
    return res;
}

/**
 * Arguments:
 *      hex (str): A color in hexadecimal format
 *
 * Return:
 *      Dict(<str -> int>): A color in rgb format.
 */
function hex2rgb(hex) {
    var r, g, b, a;
    //console.log(hex);
    if (hex.charAt(0) == '#') {
        hex = hex.substr(1);
    }

    if (hex === "000000") {
        hex = hex + "00";
    }
    ////console.log(hex.length);
    r = hex.charAt(0) + hex.charAt(1);
    g = hex.charAt(2) + hex.charAt(3);
    b = hex.charAt(4) + hex.charAt(5);
    a = hex.charAt(6) + hex.charAt(7);

    //if (!a) {
    //a = 'ff';
    //}

    ////console.log(a);

    if (a) {
        a = parseFloat(parseInt((parseInt(a, 16) / 255) * 1000) / 1000);
    } else {
        a = 1;
    }

    ////console.log(a);
    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);

    return { 'r': r, 'g': g, 'b': b, 'a': a };
}

/**
 * Arguments:
 *      Dict(<str -> int>): A color in rgb format.
 *
 * Return:
 *      hex (str): A color in hexadecimal format
 */
function rgb2hex(rgb) {
    console.log(rgb);

    function component2Hex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    var p = component2Hex(rgb['r']) + component2Hex(rgb['g']) + component2Hex(rgb['b']);
    //if (rgb["a"] !== 1) {
    ////console.log('!');
    var m = Math.round(parseFloat(rgb['a']) * 255).toString(16);
    ////console.log(m);
    var v = component2Hex(m);
    ////console.log(v);
    p = p + component2Hex(m);
    //}
    ////console.log(p);
    return p;
}

function hsl2hex(hsl) {
    return rgb2hex(hsl2rgb(hsl));
}

function hex2hsl(hex) {
    return rgb2hsl(hex2rgb(hex));
}

function _remove_alpha(colorDefault) {
    var res = {};
    var k;
    for (k in colorDefault) {
        if (k != 'a') {
            res[k] = colorDefault[k];
        }
    }
    return res;
}

function clamp(num, minimum, maximum) {
    if (num < minimum) {
        return minimum;
    } else if (num > maximum) {
        return maximum;
    } else {
        return num;
    }
}

function parseColor(colorStr) {
    colorStr = colorStr.replace(/ /gi, '');
    //console.log(colorStr);
    var transparent = colorStr.match('transparent');
    if (transparent)
        return new UserColor({ format: 'rgba', color: { r: 0, g: 0, b: 0, a: 0 } });

    var formatHex8 = colorStr.match('#[0-9a-fA-F]{8}');
    if (formatHex8)
        return new UserColor({ color: formatHex8[0], format: 'hex' });

    var formatHex = colorStr.match('#[0-9a-fA-F]{6}');
    if (formatHex)
        return new UserColor({ color: formatHex[0], format: 'hex' });

    var numbers = colorStr.match(/[0-9]+/gi),
        alpha = colorStr.match(/[0-1]\.[0-9]+/);
    //console.log(numbers);

    if (!numbers || numbers.length < 3) {
        return false;
    }
    if (!alpha) {
        alpha = [parseInt(numbers[3])];
    }
    alpha[0] = Math.round(alpha[0] * 100) / 100;
    if (colorStr.match('rgb\\([0-9]+,[0-9]+,[0-9]+\\)')) {
        return new UserColor({
            color: {
                r: parseInt(numbers[0]),
                g: parseInt(numbers[1]),
                b: parseInt(numbers[2]),
                a: 1
            },
            format: 'rgba'
        });
    } else if (colorStr.match('rgba\\([0-9]+,[0-9]+,[0-9]+,[0-1](\.[0-9]+)?\\)')) {
        return new UserColor({
            color: {
                r: parseInt(numbers[0]),
                g: parseInt(numbers[1]),
                b: parseInt(numbers[2]),
                a: parseFloat(alpha[0])
            },
            format: 'rgba'
        });
    } else if (colorStr.match('hsl\\([0-9]+,[0-9]+%,[0-9]+%\\)')) {
        return new UserColor({
            color: {
                h: parseInt(numbers[0]),
                s: parseInt(numbers[1]),
                l: parseInt(numbers[2]),
                a: 1
            },
            format: 'hsl'
        });
    } else if (colorStr.match('hsla\\([0-9]+,[0-9]+%,[0-9]+%,[0-1](\.[0-9]+)?\\)')) {
        //console.log(colorStr);
        //console.log(numbers);
        //const hp, sp, lp;
        const hp = parseInt(numbers[0]);
        const sp = parseInt(numbers[1]);
        const lp = parseInt(numbers[2]);
        //console.log(hp);
        //console.log(sp);
        //console.log(lp);
        const parsedColor = { h: hp, s: sp, l: lp, a: parseFloat(alpha[0]) };
        //console.log(parsedColor);
        const ggg = new UserColor({
            /*color: {
                h: hp,
                s: sp,
                l: lp,
                a: parseFloat(alpha[0])
            }*/
            color: parsedColor,
            format: 'hsla'
        });
        //console.log(ggg);
        /*return new UserColor({
            color: {
                h: parseInt(numbers[0]),
                s: parseInt(numbers[1]),
                l: parseInt(numbers[2]),
                a: parseFloat(alpha[0])
            },
            format: 'hsla'
        });*/
        return ggg;
    }
    return false;
}

"use strict"
var addAMark, gradient;
console.time("hex");
var EDITOR = $("#gradient-editor .gradient-real"),
    PREVIEW = $("#gradient-preview .gradient-real"),
    COLOR_LOCATION_SLIDER = $("#color-location-slider-bar");

function GradientCSS(options) {
    console.log(options);
    var info = {};
    this.parse = true;
    this.colorStopHSL = null;
    console.log("width" + EDITOR.width());
    /////////////////////////this.widthDefault = 560;
    this.widthDefault = EDITOR.width() || 560;
    if (options) {
        this.backgroundColor = options["color"] || "rgba(0, 0, 0, 0)";
        this.format = options["format"] || "rgba";
        this.order = options["order"] || ["0"];
        this.priority = options["priority"] || 0;
        this.gradientIndex = options["css"];
        info = _importCssCode(options["css"][this.priority].bg_image);
        if (info) {

            if (info["linearOrientation"] === 0) {
                this.linearOrientation = 0;
            } else {
                this.linearOrientation = info["linearOrientation"] || "to bottom";
            }

            this.radialShape = info["radialShape"] || "ellipse";
            this.radialSize = info["radialSize"] || "farthest-corner";

            this.radialHorizontalSize = info["radialHorizontalSize"] || 50;
            this.radialHorizontalSizeUnit = info["radialHorizontalSizeUnit"] || "em";
            this.radialVerticalSize = info["radialVerticalSize"] || 50;
            this.radialVerticalSizeUnit = info["radialVerticalSizeUnit"] || "em";
            //this.radialPosition = info["radialPosition"] || "center center";

            if (info["radialVerticalPosition"] === 0) {
                this.radialVerticalPosition = 0;
            } else {
                this.radialVerticalPosition = info["radialVerticalPosition"] || "center";
            }

            if (info["radialHorizontalPosition"] === 0) {
                this.radialHorizontalPosition = 0;
            } else {
                this.radialHorizontalPosition = info["radialHorizontalPosition"] || "center";
            }

            this.radialVerticalPositionUnit = info["radialVerticalPositionUnit"] || "key-value";
            this.radialHorizontalPositionUnit = info["radialHorizontalPositionUnit"] || "key-value"; /////////////////////////////////////////////////

            this.conicStartAngle = info["conicStartAngle"] || 0;

            if (info["conicHorizontalPosition"] === 0) {
                this.conicHorizontalPosition = 0;
            } else {
                this.conicHorizontalPosition = info["conicHorizontalPosition"] || "center";
            }

            if (info["conicVerticalPosition"] === 0) {
                this.conicVerticalPosition = 0;
            } else {
                this.conicVerticalPosition = info["conicVerticalPosition"] || "center";
            }

            this.conicHorizontalPositionUnit = info["conicHorizontalPositionUnit"] || "px";
            this.conicVerticalPositionUnit = info["conicVerticalPositionUnit"] || "px";
            this.type = info["type"] || "linear";
            this.repeat = info["repeat"] || false;
            //this.colorStops = _generateColorStops(info, 560);
            this.colorStops = _generateColorStops(info, this.widthDefault);

            this.changeFormatColor(this.format);
        } else if (options["css"]) {
            this.parse = false;
        }
    }
}

GradientCSS.prototype.addStopMarker = function(listElements, mark, specialCase) {
    var c = mark.location,
        i = 0,
        res = [];
    res = res.concat(listElements, [mark]);
    res.sort(function(a, b) {
        return a.location - b.location;
    });
    for (i = 0; i < res.length; i++) {
        if (res[i] === mark) {
            console.log(mark);
            res[i]["htmlBlock"] = _createStopMarker(i, mark, this.widthDefault);
            res[i]["htmlBlock"].addClass("selected");
        } else if (res[i].location >= mark.location) {
            if (res[i]["htmlBlock"]) {
                res[i]["htmlBlock"].removeClass("selected");
                res[i]["htmlBlock"].attr("position", res[i].location);
                res[i]["htmlBlock"].attr("imarker", i);
            } else {
                res[i]["htmlBlock"] = _createStopMarker(i, mark, this.widthDefault);
            }
        } else {
            res[i]["htmlBlock"].removeClass("selected");
        }
    }
    if (specialCase) {
        var r = res.length,
            w = [],
            o = [];
        for (i = 0; i < r; i++) {
            if (res[i].location === c) {
                w.push(i);
                o.push(res[i]);
            }
        }
        if (w.length > 1) {
            var j, q = o.length;
            o.unshift(o.pop());
            for (j = 0; j < q; j++) {
                res[w[j]] = o[j];
            }
        }
    }
    this.colorStops = res;
};

GradientCSS.prototype.removeStopMarker = function(listElements, location, value) {
    var i, k, res, cond, l = listElements.length,
        elem = false;
    if (listElements.length <= 2)
        return null;
    res = [];
    for (i = 0; i < l; i++) {
        if (listElements[i].location != location) {
            res.push(listElements[i]);
        } else {
            cond = (value && value.equals(this.colorStops[i].color));
            cond = cond || (!value);
            if (cond) {
                elem = listElements[i];
                break;
            } else {
                res.push(listElements[i]);
            }
        }
    }
    for (k = i + 1; k < l; k++) {
        listElements[k]["htmlBlock"].attr("position", listElements[k].location);
        listElements[k]["htmlBlock"].attr("imarker", k - 1);
        res.push(listElements[k]);
    }
    this.colorStops = res;
    return elem;
};

GradientCSS.prototype.getStopMarker = function(location, specialCase) {
    console.log(location);
    var i, c = this.colorStops,
        l = c.length,
        res = false;
    if (specialCase) {
        for (i = 0; i < l; i++) {
            if (c[i].htmlBlock.hasClass("selected")) {
                res = c[i];
                break;
            }
        }
        return res;
    } else {
        for (i = 0; i < l; i++) {
            if (c[i].location === location) {
                console.log(c[i]);
                res = c[i];
                break;
            }
        }
        return res;
    }
};

GradientCSS.prototype.showAllColorStops = function() {
    var i, c = this.colorStops,
        l = c.length - 1;
    $(".stop-markers").html("");
    for (i = l; i >= 0; i--) {
        c[i].htmlBlock = eventDraggable(".stop-markers", c[i].htmlBlock);
        (c[i].htmlBlock).appendTo($(".stop-markers"));
    }
};

GradientCSS.prototype.updateGradientEditor = function() {
    var css = "linear-gradient(to right," + getPoints(this.colorStops, "rgba");
    EDITOR.css("background-image", css);
    console.log(css);
}

GradientCSS.prototype.updateGradientPreview = function() {
    var css, target;
    target = this.gradientIndex[this.priority];
    if (this.colorStopHSL) {
        css = this.getCssCode() + getPoints(this.colorStopHSL[this.priority], this.format);
    } else {
        css = this.getCssCode() + getPoints(this.colorStops, this.format);
        target.points = this.colorStops;
    }
    target.bg_image = css;
    target.mini_preview.css("background-image", css);
}

GradientCSS.prototype.updateMarks = function(colorLists) {
    console.log(colorLists);
    var color, block, i, l = colorLists.length;
    for (i = 0; i < l; i++) {
        color = colorLists[i].color.displayColor("rgba");
        block = this.colorStops[i].htmlBlock;
        block.attr("color", color);
        block.trinity.attr("color", color);
        block.trinity.css("background-color", color);
    }
}

GradientCSS.prototype.saveHSLStops = function() {
    if (!this.colorStopHSL || this.colorStopHSL.length === 0)
        return null;
    var i, j, color, colorstop, colorRgba, index = this.gradientIndex,
        colorStopHSL = this.colorStopHSL,
        colorStopHSLLength = colorStopHSL.length,
        target = colorStopHSL[this.priority],
        targetlength = target.length;

    for (i = 0; i < colorStopHSLLength; i++) {
        index[i].points = colorStopHSL[i];
    }
    for (j = 0; j < targetlength; j++) {
        color = target[j].color;
        colorRgba = color.displayColor("rgba");
        colorstop = this.gradientIndex[this.priority].points[j];
        colorstop.color = color.clone();
        colorstop.htmlBlock.trinity.css("background-color", colorRgba);
        colorstop.htmlBlock.attr("color", colorRgba);
    }
    this.colorStopHSL = null;
    _resetHslPanel();
    $(".adjust-color").hide();
};

GradientCSS.prototype.changeFormatColor = function(colorFormat) {
    var i, index = this.gradientIndex,
        l = index.length;
    for (i = 0; i < l; i++) {
        index[i].bg_image = index[i].pattern + " " + _changeFormat(index[i].points, colorFormat) + ")";
    }
    return colorFormat;
};

function _changeFormat(colorStops, format) {
    var j, text = "",
        m = colorStops.length;

    for (j = 1; j < m; j++) {
        colorStops[j].color.changeFormatColor(format);
        text += ", " + colorStops[j].color.displayColor() + " " + colorStops[j].location + "%";
    }

    colorStops[0].color.changeFormatColor(format);
    text = colorStops[0].color.displayColor() + " " + colorStops[0].location + "%" + text;
    return text;
}

GradientCSS.prototype.showFormatColor = function(colorFormat) { ///////////////////////////////////////////////
    console.log(colorFormat);
    var j, value = "",
        order = gradient.order,
        index = gradient.gradientIndex,
        orderLength = order.length;

    for (j = 0; j < orderLength; j++) {
        if (index[order[j]].visible === false) {
            continue;
        }
        value += ", " + index[order[j]].pattern + " " + _showFormat(index[order[j]].points, colorFormat) + ")";
    }
    console.log(value);
    value = value.substring(2);
    console.log(CSS.supports("background-image", value));

    return value;
}

function _showFormat(colorStops, format) {
    var j, text = "",
        m = colorStops.length;

    for (j = 1; j < m; j++) {
        text += ", " + colorStops[j].color.displayColor(format) + " " + colorStops[j].location + "%";
    }
    text = colorStops[0].color.displayColor(format) + " " + colorStops[0].location + "%" + text;
    return text;
}

GradientCSS.prototype.updateHSLLevels = function(hue, saturation, lightness) {
    this.colorStopHSL = [];

    var a = this.colorStopHSL,
        i, x = this.gradientIndex,
        priority = this.priority,
        y, e = x.length;

    saturation = clamp(saturation, -100, 100);
    lightness = clamp(lightness, -100, 100);

    for (i = 0; i < e; i++) {
        if (i === priority) {
            y = _changeHSLLevels(x[i].points, hue, saturation, lightness, i, a, x, true);
        } else {
            y = _changeHSLLevels(x[i].points, hue, saturation, lightness, i, a, x);
        }
        console.log(y);
        x[i].bg_image = y;
        x[i].mini_preview.css("background-image", y);
    }
    this.colorStops = this.colorStopHSL[this.priority];
    this.updateGradientEditor();
    this.updateMarks(this.colorStops);
    _updateGradientCSS(["bg_image"]);
};

function _changeHSLLevels(colorStop, hue, saturation, lightness, index, a, x, priority) {
    var f, p, text = "",
        HSLstops = [],
        g = colorStop.length;

    if (priority) {
        for (f = 0; f < g; f++) {
            HSLstops.push({ location: colorStop[f].location, htmlBlock: colorStop[f].htmlBlock, color: colorStop[f].color.clone() });
        }
    } else {
        for (f = 0; f < g; f++) {
            HSLstops.push({ location: colorStop[f].location, color: colorStop[f].color.clone() });
        }
    }

    for (p = 1; p < g; p++) {
        HSLstops[p].color.changeHSLLevels(hue, saturation, lightness);
        text += "," + HSLstops[p].color.displayColor("rgba") + " " + HSLstops[p].location + "%";
    }

    HSLstops[0].color.changeHSLLevels(hue, saturation, lightness);
    text = HSLstops[0].color.displayColor("rgba") + " " + HSLstops[0].location + "%" + text;

    a.push(HSLstops);
    text = x[index].pattern + " " + text + ")";
    return text;
}

GradientCSS.prototype.reverseGradient = function() {
    this.colorStops = _reverseMarks(this.colorStops, this.widthDefault);
    this.updateGradientPreview();
    this.updateGradientEditor();
    _updateGradientCSS(["bg_image"]);
};

GradientCSS.prototype.getCssCode = function() {
    var repeat, type, text = "";
    type = this.type;
    repeat = this.repeat;
    if (type === "linear") {
        var orientation = this.linearOrientation;
        text += "linear-gradient(" + orientation;
        console.log(text);
        if (typeof orientation === "number") {
            text = text + "deg,";
        } else {
            text = text + ",";
        }
    } else if (type === "radial") {
        var shape = this.radialShape,
            radialHorizontalPosition = this.radialHorizontalPosition,
            radialVerticalPosition = this.radialVerticalPosition,
            radialHorizontalPositionUnit = this.radialHorizontalPositionUnit,
            radialVerticalPositionUnit = this.radialVerticalPositionUnit,
            radialSize;
        if (typeof radialHorizontalPosition === "number") {
            radialHorizontalPosition = radialHorizontalPosition + radialHorizontalPositionUnit;
        }
        if (typeof radialVerticalPosition === "number") {
            radialVerticalPosition = radialVerticalPosition + radialVerticalPositionUnit;
        }
        if (shape === "ellipse") {
            console.log(radialSize);
            console.log(gradient);
            if (this.radialSize.match(/closest-side|closest-corner|farthest-side|farthest-corner/)) {
                radialSize = this.radialSize;
            } else {
                radialSize = this.radialHorizontalSize + this.radialHorizontalSizeUnit + " " + this.radialVerticalSize + this.radialVerticalSizeUnit;
            }
        } else {
            if (this.radialSize.match(/closest-side|closest-corner|farthest-side|farthest-corner/)) {
                radialSize = this.radialSize;
            } else {
                radialSize = this.radialHorizontalSize + this.radialHorizontalSizeUnit;
            }
        }
        text += "radial-gradient(" + this.radialShape + " " + radialSize + " at " + radialHorizontalPosition + " " + radialVerticalPosition + ",";
    } else if (type === "conic") {

        var conicStartAngle = this.conicStartAngle,
            conicHorizontalPosition = this.conicHorizontalPosition,
            conicHorizontalPositionUnit = this.conicHorizontalPositionUnit,
            conicVerticalPosition = this.conicVerticalPosition,
            conicVerticalPositionUnit = this.conicVerticalPositionUnit;

        if (typeof conicHorizontalPosition === "number") {
            conicHorizontalPosition = conicHorizontalPosition + conicHorizontalPositionUnit;
        }
        if (typeof conicVerticalPosition === "number") {
            conicVerticalPosition = conicVerticalPosition + conicVerticalPositionUnit;
        }
        text += "conic-gradient(from " + conicStartAngle + "deg " + "at " + conicHorizontalPosition + " " + conicVerticalPosition + ",";
    }

    if (repeat) {
        text = "repeating-" + text;
    }
    this.gradientIndex[this.priority].pattern = text;
    return text;
}

function getPoints(listMarks, format) {
    console.log(listMarks);
    var i, text = "",
        l = listMarks.length;
    text += " " + _displayColorStop(listMarks[0].color, listMarks[0].location, format);
    for (i = 1; i < l; i++) {
        text += ", " + _displayColorStop(listMarks[i].color, listMarks[i].location, format);
    }
    text = text + ")";
    return text;
}

function eventDraggable(containmentClass, element) {
    console.log(element);
    var draggedMarker;
    element.draggable({
        axis: "x",
        containment: containmentClass,
        start: function(event, ui) {
            draggedMarker = gradient.getStopMarker(parseInt(ui.helper.attr("position"))); //1
            _getActiveElement().removeClass("selected");
            $(this).addClass("selected");
        },
        drag: function(event) {
            draggedMarker = _dragAndDrop(gradient, this, draggedMarker);
            gradient.updateGradientEditor();
            gradient.updateGradientPreview();
            _updateGradientCSS(["bg_image"]);
        },
        stop: function(event) {
            draggedMarker = _dragAndDrop(gradient, this, draggedMarker);
            draggedMarker = null;
            gradient.showAllColorStops();
            console.log("stopped");
        }
    });
    element.css("position", "");
    return element;
}

function _dragAndDrop(grad, drag, dragMarker) {
    var newLocation = Math.round((drag.offsetLeft / grad.widthDefault) * 100),
        oldLocation = dragMarker.location,
        element;
    if (oldLocation === newLocation) {
        return dragMarker;
    } else if (newLocation >= 100) {
        newLocation = 100;
        dragMarker.htmlBlock.css("left", drag.widthDefault + "px");
    }
    element = {};
    element["location"] = newLocation;
    element["htmlBlock"] = dragMarker.htmlBlock.clone();
    element["htmlBlock"].attr("position", newLocation);
    element["color"] = dragMarker.color.clone();
    if (newLocation > oldLocation) {
        console.log("greater");
        grad.addStopMarker(grad.colorStops, element, true);
    } else {
        console.log("lower");
        grad.addStopMarker(grad.colorStops, element, false);
    }
    grad.removeStopMarker(grad.colorStops, oldLocation, dragMarker.color);
    $("#color-location").val(newLocation);
    $("#color-location-slider-bar").slider("value", newLocation);
    grad.saveHSLStops();
    return element;
}

function _generateColorStops(options, width) {
    var i, pointColor, p = options["points"],
        l = p.length,
        colorPoints = [];
    for (i = 0; i < l; i++) {
        pointColor = p[i];
        pointColor["htmlBlock"] = _createStopMarker(i, p[i], width);
        colorPoints.push(pointColor);
    }
    return colorPoints;
}

function _reverseMarks(list, width) {
    var i, block, l = list.length,
        elements = [];
    for (i = 0; i < l; i++) {
        elements.push({ location: list[i].location, color: list[i].color.clone() });
    }
    for (i = 0; i < l; i++) {
        list[i].location = 100 - elements[list.length - i - 1].location;
        list[i].color = elements[list.length - i - 1].color;
        block = list[i].htmlBlock;
        block.attr("position", list[i].location);
        block.attr("color", list[i].color.displayColor("rgba"));
        block.css("left", ((list[i].location * width) / 100) + "px");
        block.trinity.css("background-color", list[i].color.displayColor("rgba"));
    }
    return list;
}

function _refreshLocation(activeElement, newLocation, gr) {
    var oldLocation, oldColor, element = {};
    oldLocation = activeElement.attr("position");
    oldColor = parseColor(activeElement.attr("color"));
    //console.log(oldColor);
    //oldColor.changeFormatColor(gr.format);
    //console.log(oldColor);
    element["location"] = newLocation;
    element["color"] = oldColor;
    //v = parseFloat(oldLocation);
    console.log(oldColor);
    console.log(element);
    if (newLocation > parseFloat(oldLocation)) {
        console.log("greater");
        gr.addStopMarker(gradient.colorStops, element, true);
    } else {
        console.log("smaller");
        gr.addStopMarker(gradient.colorStops, element, false);
    }
    gr.removeStopMarker(gradient.colorStops, oldLocation, oldColor);
    gr.updateGradientPreview();
    gr.updateGradientEditor();
    gr.showAllColorStops();
    _updateGradientCSS(["bg_image"]);
}

function _calculatePosition(offset, width) {
    console.log(offset);
    console.log(width);
    var x = Math.round((offset / width) * 100) - 1;
    return (x < 0) ? 0 : (x > 100) ? 100 : x;
}

function _createStopMarker(i, marker, width) {
    //console.log(marker);
    //console.log(marker.color);
    var stopMarker, colorAux, div;
    div = $("<div></div>");
    colorAux = marker.color.clone();
    stopMarker = $("<div class='color-knob'></div>");
    stopMarker.append(div);
    console.log(colorAux.displayColor("rgba"));
    //console.log(tinycolor(marker.color.color).toRgbString());
    div.css("background-color", colorAux.displayColor("rgba"));
    stopMarker.attr("title", "Color stop");
    stopMarker.attr("color", colorAux.displayColor("rgba"));
    stopMarker.addClass("stop-marker");
    stopMarker.attr("position", marker.location);
    stopMarker.attr("imarker", i);
    stopMarker.css("left", ((marker.location * width) / 100.0) + "px");
    stopMarker.trinity = div;
    console.log(stopMarker);
    return stopMarker;
}

function _displayColorStop(color, location, format) {
    //sconsole.log(color);
    return color.displayColor(format) + " " + location + "%";
}

function _deleteAllGradientsFromLocalStorage() {
    localStorage.removeItem('swatches16');
}

function _importAllGradientsFromLocalStorage() {
    var i, l, items, swatches16 = localStorage.getItem("swatches16");

    if (!swatches16) {
        var gradients = [{ "v": "linear-gradient(315deg, rgba(157,32,82,1) 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 50%, rgba(157,32,82,1) 50%, rgba(157,32,82,1) 75%, rgba(0,0,0,0) 75%), linear-gradient(45deg, rgba(17,22,39,1) 30%, rgba(86,26,60,1) 30%, rgba(86,26,60,1) 50%, rgba(17,22,39,1) 50%, rgba(17,22,39,1) 80%, rgba(86,26,60,1) 80%)", "w": "48px 48px, 32px 32px", "x": "10px 10px, 0px 0px", "y": "repeat, repeat", "z": "rgba(127,89,108,1)" }, { "v": "linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%), linear-gradient(315deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%), linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%), linear-gradient(315deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%)", "w": "160px 50px, 160px 50px, 160px 50px, 160px 50px", "x": "0px 0px, 0px 0px, 80px 50px, 80px 50px", "y": "repeat, repeat, repeat, repeat", "z": "rgba(0,173,255,1)" }, { "v": "radial-gradient(circle farthest-corner at 50% 100%, rgba(255,202,8,1) 5%, rgba(143,68,38,1) 5%, rgba(143,68,38,1) 10%, rgba(255,202,8,1) 10%, rgba(255,202,8,1) 15%, rgba(143,68,38,1) 15%, rgba(143,68,38,1) 20%, rgba(255,202,8,1) 20%, rgba(255,202,8,1) 25%, rgba(143,68,38,1) 25%, rgba(143,68,38,1) 30%, rgba(255,202,8,1) 30%, rgba(255,202,8,1) 35%, rgba(143,68,38,1) 35%, rgba(143,68,38,1) 40%, rgba(0,0,0,0) 40%), radial-gradient(circle at 100% 50%, rgba(255,202,8,1) 5%, rgba(143,68,38,1) 5%, rgba(143,68,38,1) 10%, rgba(255,202,8,1) 10%, rgba(255,202,8,1) 15%, rgba(143,68,38,1) 15%, rgba(143,68,38,1) 20%, rgba(255,202,8,1) 20%, rgba(255,202,8,1) 25%, rgba(143,68,38,1) 25%, rgba(143,68,38,1) 30%, rgba(255,202,8,1) 30%, rgba(255,202,8,1) 35%, rgba(143,68,38,1) 35%, rgba(143,68,38,1) 40%, rgba(0,0,0,0) 40%), radial-gradient(circle at 50% 0%, rgba(255,202,8,1) 5%, rgba(143,68,38,1) 5%, rgba(143,68,38,1) 10%, rgba(255,202,8,1) 10%, rgba(255,202,8,1) 15%, rgba(143,68,38,1) 15%, rgba(143,68,38,1) 20%, rgba(255,202,8,1) 20%, rgba(255,202,8,1) 25%, rgba(143,68,38,1) 25%, rgba(143,68,38,1) 30%, rgba(255,202,8,1) 30%, rgba(255,202,8,1) 35%, rgba(143,68,38,1) 35%, rgba(143,68,38,1) 40%, rgba(0,0,0,0) 40%), radial-gradient(circle at 0px 50%, rgba(255,202,8,1) 5%, rgba(143,68,38,1) 5%, rgba(143,68,38,1) 10%, rgba(255,202,8,1) 10%, rgba(255,202,8,1) 15%, rgba(143,68,38,1) 15%, rgba(143,68,38,1) 20%, rgba(255,202,8,1) 20%, rgba(255,202,8,1) 25%, rgba(143,68,38,1) 25%, rgba(143,68,38,1) 30%, rgba(255,202,8,1) 30%, rgba(255,202,8,1) 35%, rgba(143,68,38,1) 35%, rgba(143,68,38,1) 40%, rgba(0,0,0,0) 40%)", "w": "80px 80px, 80px 80px, 80px 80px, 80px 80px", "x": "0% 0%, 0% 0%, 0% 0%, 0% 0%", "y": "repeat, repeat, repeat, repeat", "z": "rgba(255,202,8,1)" }, { "v": "radial-gradient(ellipse farthest-corner at 50% 50%, rgba(1,171,206,1) 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 35%, rgba(1,171,206,1) 35%, rgba(1,171,206,1) 50%, rgba(0,0,0,0) 50%), radial-gradient(at 50% 50%, rgba(1,171,206,1) 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 35%, rgba(1,171,206,1) 35%, rgba(1,171,206,1) 50%, rgba(0,0,0,0) 50%)", "w": "40px 40px, 40px 40px", "x": "20px 20px, 0% 0%", "y": "repeat, repeat", "z": "rgba(207,247,255,1)" }, { "v": "linear-gradient(45deg, rgba(69,128,191,1) 15%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 85%, rgba(69,128,191,1) 85%), linear-gradient(135deg, rgba(0,0,0,0) 32%, rgba(76,0,168,1) 33%, rgba(76,0,168,1) 66%, rgba(0,0,0,0) 67%), linear-gradient(45deg, rgba(0,0,0,0) 32%, rgba(69,128,191,1) 33%, rgba(69,128,191,1) 65%, rgba(0,0,0,0) 66%)", "w": "20px 20px, 20px 20px, 20px 20px", "x": "0px 0px, 0px 0px, 0px 0px", "y": "repeat, repeat, repeat", "z": "rgba(216,223,32,1)" }, { "v": "linear-gradient(300deg, rgba(0,0,0,0) 80%, rgba(1,87,104,1) 80%), linear-gradient(60deg, rgba(0,0,0,0) 80%, rgba(1,87,104,1) 80%), linear-gradient(120deg, rgba(0,0,0,0) 80%, rgba(1,129,155,1) 80%), linear-gradient(240deg, rgba(0,0,0,0) 80%, rgba(1,129,155,1) 80%)", "w": "40px 40px, 40px 40px, 40px 40px, 40px 40px", "x": "0% 0%, 0% 0%, 20px 30px, 20px 30px", "y": "repeat, repeat, repeat, repeat", "z": "rgba(255,255,255,1)" }, { "v": "radial-gradient(circle farthest-corner at 100% 150%, rgba(85,185,95,1) 25%, rgba(241,200,75,1) 25%, rgba(241,200,75,1) 30%, rgba(252,136,3,1) 30%, rgba(252,136,3,1) 35%, rgba(204,56,56,1) 35%, rgba(204,56,56,1) 40%, rgba(0,0,0,0) 40%), radial-gradient(circle at 0% 150%, rgba(85,185,95,1) 25%, rgba(241,200,75,1) 25%, rgba(241,200,75,1) 30%, rgba(252,136,3,1) 30%, rgba(252,136,3,1) 35%, rgba(204,56,56,1) 35%, rgba(204,56,56,1) 40%, rgba(0,0,0,0) 40%), radial-gradient(circle at 50% 100%, rgba(148,224,208,1) 10%, rgba(168,89,243,1) 10%, rgba(168,89,243,1) 20%, rgba(65,105,225,1) 20%, rgba(65,105,225,1) 30%, rgba(85,185,95,1) 30%, rgba(85,185,95,1) 40%, rgba(241,200,75,1) 40%, rgba(241,200,75,1) 50%, rgba(252,136,3,1) 50%, rgba(252,136,3,1) 60%, rgba(204,56,56,1) 60%, rgba(204,56,56,1) 70%, rgba(0,0,0,0) 70%), radial-gradient(circle at 0% 50%, rgba(148,224,208,1) 5%, rgba(168,89,243,1) 5%, rgba(168,89,243,1) 15%, rgba(65,105,225,1) 15%, rgba(65,105,225,1) 20%, rgba(85,185,95,1) 20%, rgba(85,185,95,1) 30%, rgba(241,200,75,1) 30%, rgba(241,200,75,1) 36%, rgba(252,136,3,1) 36%, rgba(252,136,3,1) 43%, rgba(204,56,56,1) 43%, rgba(204,56,56,1) 50%, rgba(0,0,0,0) 50%), radial-gradient(circle at 100% 50%, rgba(148,224,208,1) 5%, rgba(168,89,243,1) 5%, rgba(168,89,243,1) 15%, rgba(65,105,225,1) 15%, rgba(65,105,225,1) 20%, rgba(85,185,95,1) 20%, rgba(85,185,95,1) 30%, rgba(241,200,75,1) 30%, rgba(241,200,75,1) 36%, rgba(252,136,3,1) 36%, rgba(252,136,3,1) 43%, rgba(204,56,56,1) 43%, rgba(204,56,56,1) 50%, rgba(0,0,0,0) 50%)", "w": "100px 50px, 100px 50px, 100px 50px, 100px 50px, 100px 50px", "x": "0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%", "y": "repeat, repeat, repeat, repeat, repeat", "z": "rgba(12,39,98,1)" }, { "v": "repeating-conic-gradient(from 0deg at center center, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 5%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 10%, rgba(1,171,206,1) 10%, rgba(1,171,206,1) 15%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 20%, rgba(247,148,29,1) 20%, rgba(247,148,29,1) 25%, rgba(255,202,8,1) 25%, rgba(255,202,8,1) 30%, rgba(212,30,78,1) 30%, rgba(212,30,78,1) 35%, rgba(0,0,0,1) 35%, rgba(0,0,0,1) 40%, rgba(92,46,145,1) 40%, rgba(92,46,145,1) 45%, rgba(0,0,0,1) 45%, rgba(0,0,0,1) 50%, rgba(0,166,94,1) 50%, rgba(0,166,94,1) 55%, rgba(0,0,0,0) 55%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(ellipse farthest-corner at 50% 50%, rgba(255,255,255,0.05) 20%, rgba(0,0,0,0) 20%), radial-gradient(at 50% 50%, rgba(157,255,10,1) 6%, rgba(0,0,0,0) 8%), radial-gradient(at 50% 50%, rgba(157,255,10,1) 6%, rgba(0,0,0,0) 8%), linear-gradient(45deg, rgba(0,0,0,0) 48%, rgba(0,0,0,1) 49%, rgba(0,0,0,1) 51%, rgba(0,0,0,0) 52%), linear-gradient(315deg, rgba(0,0,0,0) 48%, rgba(0,0,0,1) 49%, rgba(0,0,0,1) 51%, rgba(0,0,0,0) 52%), linear-gradient( rgba(52,46,118,1) 10%, rgba(255,195,0,1) 90%)", "w": "20px 20px, 20px 20px, 20px 20px, 20px 20px, 20px 20px, auto", "x": "0px 0px, 0px 0px, 10px 10px, 0px 0px, 0px 0px, 0% 0%", "y": "repeat, repeat, repeat, repeat, repeat, repeat", "z": "rgba(38,38,38,0)" }, { "v": "radial-gradient(ellipse farthest-corner at 50% 50%, rgba(157,255,10,1) 6%, rgba(0,0,0,0) 8%), radial-gradient(at 50% 50%, rgba(157,255,10,1) 6%, rgba(0,0,0,0) 8%), linear-gradient( rgba(255,0,136,1) 0%, rgba(58,35,175,1) 50%, rgba(0,238,255,1) 100%)", "w": "20px 20px, 20px 20px, auto", "x": "0px 0px, 10px 10px, 0% 0%", "y": "repeat, repeat, repeat", "z": "rgba(38,38,38,0)" }, { "v": "linear-gradient(45deg, rgba(250,139,255,1) 0%, rgba(43,210,255,1) 52%, rgba(43,255,136,1) 90%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(250,139,255,1)" }, { "v": "linear-gradient(43deg, rgba(65,88,208,1) 0%, rgba(200,80,192,1) 46%, rgba(255,204,112,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(65,88,208,1)" }, { "v": "linear-gradient(39deg, rgba(255,0,136,1) 0%,rgba(58,35,175,1) 50%,rgba(0,238,255,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(0deg, rgba(8,174,234,1) 0%, rgba(42,245,152,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(8,174,234,1)" }, { "v": "linear-gradient(to right, rgba(185,43,39,1) 0%, rgba(21,101,192,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(132deg, rgba(253,112,136,1) 3%, rgba(255,211,165,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(132deg, rgba(241,242,11,1) 2%, rgba(248,161,27,1) 99%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(to left top, rgba(18,194,233,1) 0%, rgba(196,113,237,1) 50%, rgba(246,79,89,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(to left top, rgba(198,255,221,1) 0%, rgba(251,215,134,1) 50%, rgba(247,121,125,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(72deg, rgba(44,222,242,1) 0%, rgba(156,43,171,1) 44%, rgba(39,43,44,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "conic-gradient(from 0deg at center center, rgba(0,255,234,1) 0%,rgba(234,0,255,1) 50%,rgba(255,234,0,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "conic-gradient(from 70deg at center center, rgba(0,255,255,1) 0%, rgba(255,0,255,1) 33%, rgba(255,255,0,1) 66%, rgba(0,255,255,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "conic-gradient(from 0deg at center center, rgba(255,0,0,1) 0%, rgba(255,165,0,1) 25%, rgba(255,255,0,1) 50%, rgba(0,128,0,1) 75%, rgba(0,0,255,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(to left, rgba(255,110,127,1) 0%, rgba(191,233,255,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "linear-gradient(to left, rgba(22,160,133,1) 0%, rgba(244,208,63,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(circle farthest-corner at 10% 20%, rgba(255,94,247,1) 17%, rgba(2,245,255,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(circle farthest-corner at 0.8% 3.1%, rgba(255,188,224,1) 0%, rgba(170,165,255,1) 46%, rgba(165,255,205,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(circle farthest-corner at 10% 20%, rgba(255,37,174,1) 0%, rgba(241,147,55,1) 53%, rgba(250,237,56,1) 99%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(circle farthest-corner at 10% 20%, rgba(254,172,245,1) 13%, rgba(233,34,210,1) 75%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(circle farthest-corner at 10% 20%, rgba(222,168,248,1) 0%, rgba(168,222,248,1) 21%, rgba(189,250,205,1) 35%, rgba(243,250,189,1) 52%, rgba(250,227,189,1) 66%, rgba(248,172,172,1) 90%, rgba(254,211,252,1) 99%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(circle farthest-corner at 6.6% 12%, rgba(64,0,126,1) 20%, rgba(0,255,160,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }];
        //var gradients = [{ "v": " linear-gradient(315deg, rgba(92,46,145,1) 0%, rgba(172,84,160,1) 100%)", "w": " 8px 8px", "x": " 0px 0px", "y": " repeat", "z": "rgba(0,0,0,0)" }, { "v": " linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%), linear-gradient(315deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%), linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%), linear-gradient(315deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 1%, rgba(255,255,255,0.2) 12%, rgba(255,255,255,1) 12%, rgba(255,255,255,0.2) 13%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 51%, rgba(255,255,255,0.2) 62%, rgba(255,255,255,1) 62%, rgba(255,255,255,0.2) 63%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 75%)", "w": " 160px 50px,  160px 50px,  160px 50px,  160px 50px", "x": " 0px 0px,  0px 0px,  80px 50px,  80px 50px", "y": " repeat,  repeat,  repeat,  repeat", "z": "rgba(0,173,255,1)" }, { "v": " linear-gradient(315deg, rgba(157,32,82,1) 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 50%, rgba(157,32,82,1) 50%, rgba(157,32,82,1) 75%, rgba(0,0,0,0) 75%), linear-gradient(45deg, rgba(17,22,39,1) 30%, rgba(86,26,60,1) 30%, rgba(86,26,60,1) 50%, rgba(17,22,39,1) 50%, rgba(17,22,39,1) 80%, rgba(86,26,60,1) 80%)", "w": " 48px 48px,  32px 32px", "x": " 10px 10px,  0px 0px", "y": " repeat,  repeat", "z": "rgba(127,89,108,1)" }, { "v": " radial-gradient(ellipse farthest-corner at 50% 50%, rgba(22,60,40,1) 20%, rgba(0,0,0,0) 20%), radial-gradient( rgba(191,191,191,1) 20%, rgba(0,0,0,0) 20%), linear-gradient(-135deg, rgba(0,0,0,0) 48%, rgba(0,89,255,1) 49%, rgba(0,89,255,1) 51%, rgba(0,0,0,0) 52%), linear-gradient(135deg, rgba(0,0,0,0) 48%, rgba(49,155,102,1) 49%, rgba(49,155,102,1) 51%, rgba(0,0,0,0) 52%)", "w": " 20px 20px,  20px 20px,  20px 20px,  20px 20px", "x": " 0px 0px,  10px 10px,  0px 0px,  0px 0px", "y": " repeat,  repeat,  repeat,  repeat", "z": "rgba(222,7,114,1)" }, { "v": " linear-gradient(45deg, rgba(114,191,69,1) 15%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 85%, rgba(114,191,69,1) 80%), linear-gradient(135deg, rgba(0,0,0,0) 33%, rgba(0,168,95,1) 33%, rgba(0,168,95,1) 65%, rgba(173,179,25,1) 66%, rgba(0,0,0,0) 67%), linear-gradient(45deg, rgba(0,0,0,0) 33%, rgba(114,191,69,1) 33%, rgba(114,191,69,1) 66%, rgba(0,0,0,0) 60%)", "w": " 20px 20px,  20px 20px,  20px 20px", "x": " 0px 0px,  0px 0px,  0px 0px", "y": " repeat,  repeat,  repeat", "z": "rgba(216,223,32,1)" }, { "v": " radial-gradient(ellipse farthest-corner at 50% 50%, rgba(255,255,255,1) 20%, rgba(0,0,0,0) 20%), linear-gradient( rgba(247,148,29,1) 0%, rgba(242,88,34,1) 100%)", "w": " 12px 12px,  auto", "x": " 0px 0px,  0% 0%", "y": " repeat,  repeat", "z": "rgba(0,0,0,0)" }, { "v": " radial-gradient(ellipse farthest-corner at 50% 50%, rgba(255,255,255,0.05) 20%, rgba(0,0,0,0) 20%), radial-gradient(at 50% 50%, rgba(255,202,8,1) 6%, rgba(0,0,0,0) 8%), radial-gradient(at 50% 50%, rgba(255,202,8,1) 6%, rgba(0,0,0,0) 8%), linear-gradient(45deg, rgba(0,0,0,0) 48%, rgba(0,0,0,1) 49%, rgba(0,0,0,1) 51%, rgba(0,0,0,0) 52%), linear-gradient(315deg, rgba(0,0,0,0) 48%, rgba(0,0,0,1) 49%, rgba(0,0,0,1) 51%, rgba(0,0,0,0) 52%)", "w": " 20px 20px,  20px 20px,  20px 20px,  20px 20px,  20px 20px", "x": " 0px 0px,  0px 0px,  10px 10px,  0px 0px,  0px 0px", "y": " repeat,  repeat,  repeat,  repeat,  repeat", "z": "rgba(38,38,38,1)" }, { "v": " linear-gradient(45deg, rgba(221,204,170,1) 12%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 88%, rgba(221,204,170,1) 88%), linear-gradient(135deg, rgba(0,0,0,0) 37%, rgba(170,136,85,1) 37%, rgba(170,136,85,1) 63%, rgba(0,0,0,0) 63%), linear-gradient(45deg, rgba(0,0,0,0) 37%, rgba(221,204,170,1) 37%, rgba(221,204,170,1) 63%, rgba(0,0,0,0) 63%)", "w": " 25px 25px,  25px 25px,  25px 25px", "x": " 0% 0%,  0% 0%,  0% 0%", "y": " repeat,  repeat,  repeat", "z": "rgba(119,85,51,1)" }, { "v": " repeating-conic-gradient(from 0deg at center center, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 5%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 10%, rgba(1,171,206,1) 10%, rgba(1,171,206,1) 15%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 20%, rgba(247,148,29,1) 20%, rgba(247,148,29,1) 25%, rgba(255,202,8,1) 25%, rgba(255,202,8,1) 30%, rgba(212,30,78,1) 30%, rgba(212,30,78,1) 35%, rgba(0,0,0,1) 35%, rgba(0,0,0,1) 40%, rgba(92,46,145,1) 40%, rgba(92,46,145,1) 45%, rgba(0,0,0,1) 45%, rgba(0,0,0,1) 50%, rgba(0,166,94,1) 50%, rgba(0,166,94,1) 55%, rgba(0,0,0,0) 55%)", "w": " auto auto", "x": " 0% 0%", "y": " repeat", "z": "rgba(0,0,0,0)" }, { "v": " linear-gradient(135deg, rgba(236,237,220,1) 25%, rgba(0,0,0,0) 26%), linear-gradient(225deg, rgba(236,237,220,1) 25%, rgba(0,0,0,0) 26%), linear-gradient(315deg, rgba(236,237,220,1) 25%, rgba(0,0,0,0) 26%), linear-gradient(45deg, rgba(236,237,220,1) 25%, rgba(0,0,0,0) 26%)", "w": " 10px 10px, 10px 10px, 10px 10px, 10px 10px", "x": " -5px 0px, -5px 0px,  0% 0%,  0% 0%", "y": " repeat,  repeat,  repeat,  repeat", "z": "rgba(17,0,0,1)" }, { "v": "radial-gradient(circle closest-side at 50% 50%, rgba(0,0,0,0) 96%, rgba(0,0,0,0.3) 100%), radial-gradient(circle closest-side at 50% 50%, rgba(0,0,0,0) 96%, rgba(0,0,0,0.3) 100%)", "w": "30px 10px,  30px 8px", "x": "0px 0px,  15px 15px", "y": "repeat,  repeat", "z": "rgba(42,139,40,1)" }, { "v": "repeating-radial-gradient(ellipse farthest-corner at left top, rgba(0,165,223,1) 0%, rgba(62,20,123,1) 20%, rgba(226,0,121,1) 40%, rgba(223,19,44,1) 60%, rgba(243,239,21,1) 80%, rgba(0,152,71,1) 100%)", "w": "auto", "x": "0% 0%", "y": "repeat", "z": "rgba(0,0,0,0)" }, { "v": "radial-gradient(ellipse farthest-corner at center center, rgba(171,222,210,1) 12%,rgba(0,0,0,0) 12%,rgba(0,0,0,0) 88%,rgba(171,222,210,1) 88%), linear-gradient( rgba(118,46,77,1) 0%,rgba(251,0,255,1) 50%,rgba(255,0,47,1) 100%)", "w": "25px 25px, auto", "x": "0% 0%, 0% 0%", "y": "repeat, repeat", "z": "rgba(119,85,51,1)" }, { "v": "radial-gradient(ellipse farthest-corner at center center, rgba(206,222,171,1) 12%,rgba(0,0,0,0) 12%,rgba(0,0,0,0) 88%,rgba(206,222,171,1) 88%), linear-gradient( rgba(53,46,118,1) 0%,rgba(0,123,255,1) 50%,rgba(89,0,255,1) 100%)", "w": "25px 25px, auto", "x": "0% 0%, 0% 0%", "y": "repeat, repeat", "z": "rgba(119,85,51,1)" }];
        gradients = JSON.stringify(gradients);
        localStorage.setItem("swatches16", gradients);
    }
    swatches16 = localStorage.getItem("swatches16");
    items = JSON.parse(swatches16);

    l = items.length;
    for (i = 0; i < l; i++) {
        _importGradientFromLocalStorage(i, items[i]);
    }
}

function _importGradientFromLocalStorage(index, css) {
    var element = $("<li class='gradient-background'><div class='load-preset' data-index='" + index + "'></div></li>");
    element.appendTo(".presets-list");
    element = $(element.find("div"));
    element.css("background-image", css.v);
    element.css("background-size", css.w);
    element.css("background-position", css.x);
    element.css("background-repeat", css.y);
    element.css("background-color", css.z);
}

function _importCssCode(cssCode) {
    console.log(cssCode);
    var repeating, res = false;
    if (!cssCode) {
        return false;
    }
    if (cssCode.match("repeating")) {
        repeating = true;
    } else {
        repeating = false;
    }
    console.log(cssCode);

    if (cssCode.match("linear-gradient")) {
        cssCode = cssCode.slice(cssCode.search("linear-gradient") + 15);
        res = _importLinear(cssCode, repeating);
        console.log(res);
    } else if (cssCode.match("radial-gradient")) {
        cssCode = cssCode.slice(cssCode.search("radial-gradient") + 15);
        ////console.log(cssCode);
        res = _importRadial(cssCode, repeating);
    } else if (cssCode.match("conic-gradient")) {
        cssCode = cssCode.slice(cssCode.search("conic-gradient") + 14);
        res = _importConic(cssCode, repeating);
    }
    if (repeating) {
        res["pattern"] = "repeating-" + res["pattern"];
    }
    res.repeat = repeating;
    return res;
}

function _importLinear(input) {
    var dir, dirUnit, res = {};
    var options = input.match("\\([-a-zA-Z0-9%\. \()]+,")[0];
    //////console.log(options);
    if (options.match(/rgb|hsl|#/)) {
        res["pattern"] = "linear-gradient(";
    } else {
        //////console.log("not match");
        res["pattern"] = "linear-gradient" + options;
    }
    //if (dir = input.match(/\((\-?\d{1,3}(?:\.\d+)?(deg|g?rad|turn))|\((to (?:bottom left|bottom right|top left|top right|left bottom|left top|right top|right bottom|bottom|left|right|top))/)) {
    dir = input.match(/\((\-?\d{1,3}(?:\.\d+)?(deg|g?rad|turn))|\((to (?:bottom left|bottom right|top left|top right|left bottom|left top|right top|right bottom|bottom|left|right|top))/);

    if (dir) {
        //////console.log(dir);
        input = input.replace(dir[0], "");
        if (dir[0].match(/\d/)) {
            dirUnit = dir[2];
            dir = dir[1];
            if (dirUnit === "deg") {
                dir = parseFloat(dir);
            } else if (dirUnit === "grad") {
                dir = parseFloat(dir) / 1.1111111;
            } else if (dirUnit === "rad") {
                dir = parseFloat(dir) / 0.0174532925199;
            } else if (dirUnit === "turn") {
                dir = parseFloat(dir) * 360;
            }
        } else {
            dir = dir[3];
        }
    } else {
        input = input.replace("(", "");
        dir = "to bottom";
    }
    res["linearOrientation"] = dir;
    res["points"] = _importCssCodeGetListPoints(input);
    res["type"] = "linear";
    //////console.log(input);
    console.log("dir");
    console.log(res);
    return res;
}

function _importRadial(input) {
    //console.log(input);
    var shape, size, hrSize, hrSizeUnit, vrSize, vrSizeUnit, position, hrPosition, hrPositionUnit, vrPosition, vrPositionUnit, res = {};
    ////console.log(input);
    //var options = input.match("\\([-a-zA-Z0-9%\. \()]+,")[0];
    var options = input.match("\\([-a-zA-Z0-9%. ()]+,")[0];

    ////console.log(options);
    if (options.match(/rgb|hsl|#/)) {
        res["pattern"] = "radial-gradient(";
    } else {
        res["pattern"] = "radial-gradient" + options;
    }

    input = input.replace(/\s/g, "");
    ////console.log(input);
    if (shape = input.match(/^\((circle|ellipse)/)) {
        input = input.replace(shape[0], "");
        shape = shape[1];
        ////console.log(shape);
        ////console.log("pass");
    } else {
        input = input.replace("(", "");
        shape = "ellipse";
        //console.log("find error");
        //console.log(shape);
        //shape = "circle";
    }
    ////console.log(shape);
    ////console.log(input);
    if (shape === "circle") {
        //console.log(shape);
        if (size = input.match(/^(\d{1,3}(?:\.\d+)?)(px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh)|closest-side|closest-corner|farthest-side|farthest-corner/)) {
            ////console.log(size);
            input = input.replace(size[0], "");
            if (size[0].match(/\d{1,4}/)) {
                hrSize = size[1];
                hrSizeUnit = size[2];
                size = hrSize + hrSizeUnit;
            } else {
                size = size[0];
            }
        } else {
            size = "farthest-corner";
        }
    } else {
        ////console.log("ellipse");
        ////console.log(input);
        //shape = "ellipse";
        if (size = input.match(/^(\d{1,3}(?:\.\d+)?)(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh)(\d{1,3}(?:\.\d+)?)(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh)|^(\d{1,3}(?:\.\d+)?)(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh)|closest-side|closest-corner|farthest-side|farthest-corner/)) {
            input = input.replace(size[0], "");
            ////console.log(size);
            if (size[1] && size[3]) {
                ////console.log("wow");
                hrSize = parseFloat(size[1]);
                hrSizeUnit = size[2];
                vrSize = parseFloat(size[3]);
                vrSizeUnit = size[4];
                size = hrSize + hrSizeUnit + " " + vrSize + vrSizeUnit;
            } else if (size[5]) {
                hrSize = parseFloat(size[5]);
                hrSizeUnit = size[6];
                vrSize = parseFloat(size[5]);
                vrSizeUnit = size[6];
                size = hrSize + hrSizeUnit + " " + vrSize + vrSizeUnit;
            } else {
                size = size[0];
            }
            ////console.log(size);
        } else {
            size = "farthest-corner";
        }
    }
    if (position = input.match(/^at(center|left|right|-?\d{1,3}(?:\.\d+)?(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh))(bottom|center|top|-?\d{1,3}(?:\.\d+)?(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh))|^at(bottom|center|left|right|top|-?\d{1,3}(?:\.\d+)?(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh))/)) {
        ////console.log(position);
        input = input.replace(position[0], "");
        if (position[1] && position[3]) {
            ////console.log("1&3");
            if (position[1].match(/\d/)) {
                hrPosition = parseFloat(position[1]);
                hrPositionUnit = position[2];
            } else {
                hrPosition = position[1];
                //hrPositionUnit = "key-value";
            }
            if (position[3].match(/\d/)) {
                vrPosition = parseFloat(position[3]);
                vrPositionUnit = position[4];
            } else {
                vrPosition = position[3];
                //vrPositionUnit = "key-value";
            }
        } else if (position[5]) {
            ////console.log("else");
            if (position[5].match(/\d/)) {
                hrPosition = parseFloat(position[5]);
                hrPositionUnit = position[6];
                vrPosition = "center";
                //vrPositionUnit = "key-value";
            } else if (position[5].match(/center|left|right/)) {
                hrPosition = position[5];
                //hrPositionUnit = "key-value";
                vrPosition = "center";
                //vrPositionUnit = "key-value";
            } else if (position[5].match(/center|bottom|top/)) {
                vrPosition = position[5];
                //vrPositionUnit = "key-value";
                hrPosition = "center";
                //hrPositionUnit = "key-value";
            }
        }
    } else {
        hrPosition = 50;
        hrPositionUnit = "%";
        vrPosition = 50;
        vrPositionUnit = "%";
        //position = "50% 50%";
    }

    res["radialSize"] = size;
    res["radialShape"] = shape;
    res["radialHorizontalSize"] = hrSize;
    res["radialVerticalSize"] = vrSize;
    res["radialHorizontalSizeUnit"] = hrSizeUnit;
    res["radialVerticalSizeUnit"] = vrSizeUnit;
    res["radialHorizontalPosition"] = hrPosition;
    res["radialHorizontalPositionUnit"] = hrPositionUnit;
    res["radialVerticalPositionUnit"] = vrPositionUnit;
    res["radialVerticalPosition"] = vrPosition;
    res["type"] = "radial";
    res["points"] = _importCssCodeGetListPoints(input);
    ////console.log(input);
    ////console.log(shape);
    ////console.log(size);
    ////console.log(hrSize);
    ////console.log(hrSizeUnit);
    ////console.log(vrSize);
    ////console.log(vrSizeUnit);
    ////console.log(position);
    ////console.log(hrPosition);
    ////console.log(hrPositionUnit);
    ////console.log(vrPosition);
    ////console.log(vrPositionUnit);
    return res;
}

function _importConic(input) {
    var angle, angleUnit, position, hrPosition, hrPositionUnit, vrPosition, vrPositionUnit, res = {};
    //var options = input.match("\\([-a-zA-Z0-9%\. \()]+,")[0];
    var options = input.match("\\([-a-zA-Z0-9%. ()]+,")[0];

    ////console.log(options);
    if (options.match(/rgb|hsl|#/)) {
        res["pattern"] = "conic-gradient(";
    } else {
        ////console.log("not match");
        res["pattern"] = "conic-gradient" + options;
    }
    input = input.replace(/\s/g, "");
    ////console.log(input);
    if (angle = input.match(/^\(from(\-?\d{1,3}(?:\.\d+)?)(deg|g?rad|turn)/)) {
        ////console.log(angle);
        input = input.replace(angle[0], "");
        angleUnit = angle[2];
        angle = angle[1];
        ////console.log(angle);
        if (angleUnit.match(/deg/)) {
            angle = parseFloat(angle);
        } else if (angleUnit.match(/grad/)) {
            angle = parseFloat(angle) / 1.1111111;
        } else if (angleUnit.match(/rad/)) {
            angle = parseFloat(angle) / 0.0174532925199;
        } else if (angleUnit.match(/turn/)) {
            angle = parseFloat(angle) * 360;
        }
    } else {
        input = input.replace("(", "");
        angle = 0;
    }
    if (position = input.match(/^at(center|left|right|-?\d{1,3}(?:\.\d+)?(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh))(bottom|center|top|-?\d{1,3}(?:\.\d+)?(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh))|^at(bottom|center|left|right|top|-?\d{1,3}(?:\.\d+)?(%|px|mm|cm|in|em|rem|en|ex|ch|vm|vw|vh))/)) {
        ////console.log(position);
        input = input.replace(position[0], "");
        if (position[1] && position[3]) {
            ////console.log("1&3");
            if (position[1].match(/\d/)) {
                hrPosition = parseFloat(position[1]);
                hrPositionUnit = position[2];
            } else {
                hrPosition = position[1];
            }
            if (position[3].match(/\d/)) {
                vrPosition = parseFloat(position[3]);
                vrPositionUnit = position[4];
            } else {
                vrPosition = position[3];
            }
        } else if (position[5]) {
            ////console.log("else");
            if (position[5].match(/\d/)) {
                hrPosition = parseFloat(position[5]);
                hrPositionUnit = position[6];
                vrPosition = "center";
                position = hrPosition + hrPositionUnit + vrPosition;
            } else if (position[5].match(/center|left|right/)) {
                hrPosition = position[5];
                vrPosition = "center";
                position = hrPosition + vrPosition;
            } else if (position[5].match(/center|bottom|top/)) {
                vrPosition = position[5];
                hrPosition = "center";
                position = hrPosition + vrPosition;
            }
        }
    } else {
        position = "center center";
    }
    ////console.log(hrPosition);
    ////console.log(hrPositionUnit);
    ////console.log(vrPosition);
    ////console.log(vrPositionUnit);
    res["conicStartAngle"] = angle;
    res["conicHorizontalPosition"] = hrPosition;
    res["conicVerticalPosition"] = vrPosition;
    res["conicHorizontalPositionUnit"] = hrPositionUnit;
    res["conicVerticalPositionUnit"] = vrPositionUnit;
    res["points"] = _importCssCodeGetListPoints(input);
    res["type"] = "conic";
    ////console.log(input);
    ////console.log(angle);
    ////console.log(position);
    return res;
}

function _importCssCodeGetListPoints(cssCode) {
    console.log(cssCode);
    if (!cssCode.startsWith(",")) {
        ////console.log("LLLL");
        cssCode = "," + cssCode;
    }
    var color, point, position, listPoints = [];
    cssCode = cssCode.replace(/ /gi, "");
    //console.log(cssCode);

    while (true) {
        point = {};
        //console.log(cssCode);
        cssCode = cssCode.replace(/,/, "");
        //console.log(cssCode);
        if (color = cssCode.match("^(rgba|rgb|hsl|hsla)\\([a-zA-Z0-9,%\.]+\\)")) {
            console.log(parseColor(color[0]));
            const v = parseColor(color[0]);
            point["color"] = v;
            console.log(point["color"]);
        } else if (color = cssCode.match("^#[0-9a-fA-F]{8}")) {
            point["color"] = parseColor(color[0]);
        } else if (color = cssCode.match("^#[0-9a-fA-F]{6}")) {
            point["color"] = parseColor(color[0]);
        } else if (color = cssCode.match("transparent")) {
            point["color"] = new UserColor({ format: "rgba", color: { r: 0, g: 0, b: 0, a: 0 } });
        } else {
            break;
        }
        console.log(color[0]);
        cssCode = cssCode.replace(color[0], "");
        console.log(cssCode);
        position = cssCode.match("[0-9.]+(%|px|em)");
        if (!position) {
            break;
        }
        point["location"] = parseInt(cssCode.match("[0-9]+"));
        ////console.log(position);
        cssCode = cssCode.replace(position[0], "");
        ////console.log(cssCode);
        listPoints.push(point);
    }
    if (listPoints.length < 2) {
        return [];
    }
    console.log(listPoints);
    return listPoints;
}

function _CSSValueParser(value, start) {
    console.log(value);
    var res, j, m, importcss, elems, containerHolder = $(".grads__container"),
        bg_prop = [],
        css_data = {},
        bg_img = value.a,
        bg_pos = value.b,
        bg_size = value.c.split(","),
        bg_repeat = value.d.split(","),
        bg_color = value.e;

    console.log(bg_pos);
    bg_pos = bg_pos.replace(/center/g, "50%");
    bg_pos = bg_pos.replace(/left|top/g, "0%");
    bg_pos = bg_pos.replace(/right|bottom/g, "100%");
    bg_pos = bg_pos.split(",");
    console.log(bg_pos);
    bg_img = bg_img.replace(/\),/g, "\)!");
    bg_img = bg_img.split("!");
    console.log(bg_img);
    console.log(bg_size);

    m = bg_img.length;
    if (m > bg_pos.length) {
        var ds = bg_pos;
        do {
            bg_pos = bg_pos.concat(ds);
        }
        while (bg_pos.length < m);
    }

    if (m > bg_repeat.length) {
        var dr = bg_repeat;
        do {
            bg_repeat = bg_repeat.concat(dr);
        }
        while (bg_repeat.length < m);
    }

    if (m > bg_pos.length) {
        var dp = bg_pos;
        do {
            bg_pos = bg_pos.concat(dp);
        }
        while (bg_pos.length < m);
    }
    var k = false;
    if (start === 0 || start) {
        k = start;
    }

    for (j = 0; j < m; j++) {
        if (bg_img[j].match(/none/g)) {
            continue;
        }
        res = {};
        res.bg_image = bg_img[j];
        res.bg_size = bg_size[j];
        res.bg_position = bg_pos[j];
        res.bg_repeat = bg_repeat[j];
        res.visible = true;
        importcss = _importCssCode(bg_img[j]);
        res.pattern = importcss.pattern;
        res.points = importcss.points;
        k++;
        elems = new G(k, bg_img[j], bg_size[j], bg_pos[j], bg_repeat[j], bg_color);
        res.bg_elem = elems.container;
        res.mini_preview = elems.mini;
        containerHolder.append(res.bg_elem);
        bg_prop.push(res);
    }
    containerHolder.sortable({
        handle: ".grad__handle",
        start: function(event, ui) {},
        update: function(event, ui) {
            _updateContainer();
        },
    });
    css_data.bg_prop = bg_prop;
    console.log(css_data);
    return css_data;
}

function G(id, cssvalue, bg_size_value, bg_pos_value, bg_repeat_value, bg_color_value) {
    console.log(id);
    console.log(cssvalue);
    console.log(bg_size_value);
    console.log(bg_pos_value);
    console.log(CSS.supports("background-image", cssvalue));
    this.id = id;

    var container, size, pos, repeat, view, hide, remove, parse, handle, mini_preview, reu = {};
    container = $("<li class='grad' id=" + id + "></li>");
    handle = $("<div class='grad__handle'></div>");
    mini_preview = $("<div class='mini-preview'></div>");
    mini_preview.css("background-image", cssvalue);
    mini_preview.css("background-color", bg_color_value);

    size = this.createSize(bg_size_value, container);
    pos = this.createPos(bg_pos_value, container);

    repeat = this.createRepeat(bg_repeat_value, container);
    view = this.createView(id, cssvalue, bg_size_value, bg_pos_value, bg_repeat_value, container);
    hide = this.createHide(id, container);
    remove = this.createRemove(container);
    parse = this.createParse(id, container, mini_preview);

    this.size = size;
    this.pos = pos;
    this.repeat = repeat;
    this.view = view;
    this.parse = parse;

    container.append(remove);
    container.append(hide);
    container.append(view);
    container.append(size.elem1);
    container.append(size.elem2);
    container.append(pos.elem1);
    container.append(pos.elem2);
    container.append(repeat);
    container.append(parse);
    container.append(handle);
    reu["container"] = container;
    reu["mini"] = mini_preview;
    return reu;
}

G.prototype.createSpinner = function(spinner1, selectbox1, selectbox2) {
    var id = this.id,
        min;
    if (selectbox1.data("target") === "bg_size") {
        min = 0;
    } else {
        min = -999;
    }

    spinner1.spinner({
        max: 999,
        min: min,
        create: function() {
            var widget = $(this).spinner("widget");
            widget.css("float", "left");
        },
        spin: function(event, ui) {
            _updateSpinner(ui.value, id, selectbox1, selectbox2);
        }
    });

    spinner1.on("keyup", function(event, ui) {
        _updateSpinner($(this).val(), id, selectbox1, selectbox2);
    });
}

function _updateSpinner(val, id, selectbox1, selectbox2) {
    var type, target, value, value1, value2, nx;
    type = selectbox1.data("type");
    target = selectbox1.data("target");
    value1 = val + selectbox1.attr("unit");
    value2 = selectbox2.attr("value") + selectbox2.attr("unit");

    nx = gradient.gradientIndex[id];
    if (type === "height" || type === "pos-y") {
        value = value2 + " " + value1;
    } else if (type === "width" || type === "pos-x") {
        value = value1 + " " + value2;
    }

    nx[target] = value;
    _updateGradientCSS([target]);
    selectbox1.attr("value", val);
}

function _closeAllDropDowns() {
    $(".bg-options").hide();
    $(".grad__css-container").remove();
    $(".grad__view-css").removeClass("is-checked");
}

G.prototype.createSelectBox = function(values, selectbox1, selectbox2, selectmenu1, selectmenu2, spinner1, spinner2, selected1, selected2) {
    var x, option, id = this.id,
        d = values.length,
        options = $("<div class='bg-options'></div>");

    for (x = 0; x < d; x++) {
        option = $("<div class='bg-option' data-value='" + values[x] + "'><span>" + values[x] + "</span></div>");
        option.click(function() {
            //selected1.removeClass("is-visible");
            var xv = $(this).data("value"),
                yv = selectmenu2.attr("value");

            if (xv === "px" || xv === "em" || xv === "%") {

                if (yv === "cover" || yv === "contain" || yv === "") {
                    selected2.text("auto");
                    selectbox2.attr("value", "auto");
                    selectbox2.attr("unit", "");
                    spinner2.parent().hide();
                }

                selected1.text(xv);
                selectbox1.attr("value", spinner1.val());
                selectbox1.attr("unit", xv);
                selectmenu1.attr("value", xv);

                spinner1.parent().show();
                selected1.addClass("is-unit-selected");

            } else {
                selected1.text(xv);
                selectbox1.attr("value", xv);
                selectbox1.attr("unit", "");
                selectmenu1.attr("value", xv);

                spinner1.parent().hide();
                selected1.removeClass("is-unit-selected");

                if (xv === "cover" || xv === "contain") {

                    selected2.text(xv);
                    selectbox2.attr("value", "");
                    selectbox2.attr("unit", "");
                    selectmenu2.attr("value", "");

                    spinner2.parent().hide();
                    selected2.removeClass("is-unit-selected");

                } else if (xv === "auto") {

                    if (yv === "cover" || yv === "contain" || yv === "") {
                        selected2.text("auto");
                        selectbox2.attr("value", "");
                        selectbox2.attr("unit", "");
                        spinner2.parent().hide();
                    }
                }
            }
            _updateSpinner(selectbox1.attr("value"), id, selectbox1, selectbox2);
        });
        options.append(option);
        options.hide();
    }
    return options;
}

G.prototype.createBgElem = function(data, selectbox1, selectbox2, selectmenu1, selectmenu2, spinner1, spinner2, selected1, selected2, container) {
    var values = data.options,
        elem1 = data.value,
        u1 = data.unit;

    selectbox1.append(spinner1);
    this.createSpinner(spinner1, selectbox1, selectbox2);

    var options = this.createSelectBox(values, selectbox1, selectbox2, selectmenu1, selectmenu2, spinner1, spinner2, selected1, selected2);
    selectmenu1.append(selected1);
    selectmenu1.append(options);
    selectbox1.append(selectmenu1);

    selected1.click(function() {
        _closeAllDropDowns();
        if (container.hasClass("freeze")) {
            return;
        }

        var l, t;
        if (selected1.hasClass("is-unit-selected")) {
            l = selected1.position().left - 70;
            t = selected1.position().top + 34.47;
        } else {
            l = selected1.position().left;
            t = selected1.position().top + 34.47;
        }
        options.css("left", l);
        options.css("top", t);
        options.show();
    });

    if (typeof elem1 === "number") {
        selected1.text(u1);
        spinner1.val(elem1);
        selectbox1.attr("unit", u1);
        selectmenu1.attr("value", u1);
        selected1.addClass("is-unit-selected");
    } else {
        selected1.text(elem1);
        spinner1.parent().hide();
        selectbox1.attr("unit", "");
        selectmenu1.attr("value", elem1);
        selectmenu1.attr("unit", "");
    }
    selectbox1.attr("value", elem1);
    return selectbox1;
}

G.prototype.filterSize = function(bg_size_value) {
    console.log(bg_size_value);
    var a, bg_size_u1, bg_size_u2, bg_size_s1, bg_size_s2, v = {};
    bg_size_value = bg_size_value.replace(/\s/g, "");
    console.log(bg_size_value);
    if (a = bg_size_value.match(/contain|cover/)) {
        console.log(a);
        bg_size_s1 = a[0];
        bg_size_s2 = a[0];
        bg_size_u1 = "";
        bg_size_u2 = "";
    } else if (a = bg_size_value.match(/((-?\d{1,3})(px|em|rem|%)|(auto))(((-?\d{1,3})(px|em|rem|%))|(auto))?/)) {
        console.log(a);
        if (a[4]) {
            bg_size_s1 = a[4];
            bg_size_s2 = a[4];
        } else if (a[2] && a[3]) {
            bg_size_s1 = parseFloat(a[2]);
            bg_size_u1 = a[3];
            bg_size_s2 = parseFloat(a[2]);
            bg_size_u2 = a[3];
        }
        if (a[5]) {
            if (a[6]) {
                bg_size_s2 = parseFloat(a[7]);
                bg_size_u2 = a[8];
            }
            if (a[9]) {
                bg_size_s2 = a[9];
                bg_size_u2 = "";
            }
        }
    }
    v.bg_size_value1 = bg_size_s1;
    v.bg_size_value2 = bg_size_s2;
    v.bg_size_s1 = bg_size_s1;
    v.bg_size_s2 = bg_size_s2;
    v.bg_size_u1 = bg_size_u1;
    v.bg_size_u2 = bg_size_u2;
    console.log(v);
    return v;
};

G.prototype.filterPos = function(bg_pos_value) {
    bg_pos_value = bg_pos_value.replace(/\s/g, "");
    console.log(bg_pos_value);
    var bg_pos_u1, bg_pos_u2, bg_pos_s1, bg_pos_s2, v = {};
    bg_pos_value = bg_pos_value.match(/(-?\d{1,3})(px|em|rem|%)((-?\d{1,3})(px|em|rem|%))?/);
    console.log(bg_pos_value);
    if (bg_pos_value[1] && bg_pos_value[3]) {
        bg_pos_s1 = parseFloat(bg_pos_value[1]);
        bg_pos_u1 = bg_pos_value[2];
        bg_pos_s2 = parseFloat(bg_pos_value[4]);
        bg_pos_u2 = bg_pos_value[5];
    } else if (bg_pos_value[1] && !bg_pos_value[3]) {
        bg_pos_s1 = parseFloat(bg_pos_value[1]);
        bg_pos_u1 = bg_pos_value[2];
        bg_pos_s2 = parseFloat(bg_pos_value[1]);
        bg_pos_u2 = bg_pos_value[2];
    }
    v.bg_pos_value1 = bg_pos_s1;
    v.bg_pos_value2 = bg_pos_s2;
    v.bg_pos_s1 = bg_pos_s1;
    v.bg_pos_s2 = bg_pos_s2;
    v.bg_pos_u1 = bg_pos_u1;
    v.bg_pos_u2 = bg_pos_u2;
    return v;
};

G.prototype.createSize = function(bg_size_value, container) {
    console.log(bg_size_value);
    var r = {},
        data = {},
        k = this.filterSize(bg_size_value),
        selectmenu1 = $("<div class='bg'></div>"),
        selectmenu2 = $("<div class='bg'></div>"),
        spinner1 = $("<input type='text' class='de' value='0'/>"),
        spinner2 = $("<input type='text' class='de' value='0'/>"),
        selectbox1 = $("<div class='grad__size select-box' data-type='width' data-target='bg_size'></div>"),
        selectbox2 = $("<div class='grad__size select-box' data-type='height' data-target='bg_size'></div>"),
        selected1 = $("<div class='bg-selected'></div>"),
        selected2 = $("<div class='bg-selected'></div>");
    data.options = ["contain", "cover", "auto", "px", "em", "%"];

    data.value = k.bg_size_value1;
    data.unit = k.bg_size_u1;
    r.elem1 = this.createBgElem(data, selectbox1, selectbox2, selectmenu1, selectmenu2, spinner1, spinner2, selected1, selected2, container);

    data.value = k.bg_size_value2;
    data.unit = k.bg_size_u2;
    r.elem2 = this.createBgElem(data, selectbox2, selectbox1, selectmenu2, selectmenu1, spinner2, spinner1, selected2, selected1, container);

    r.spinner1 = spinner1;
    r.spinner2 = spinner2;
    r.selected1 = selected1;
    r.selected2 = selected2;
    return r;
}

G.prototype.createPos = function(bg_pos_value, container) {
    var r = {},
        data = {},
        k = this.filterPos(bg_pos_value),
        selectmenu1 = $("<div class='bg'></div>"),
        selectmenu2 = $("<div class='bg'></div>"),
        spinner1 = $("<input type='text' class='de' value='0'/>"),
        spinner2 = $("<input type='text' class='de' value='0'/>"),
        selectbox1 = $("<div class='grad__pos select-box' data-type='pos-x' data-target='bg_position'></div>"),
        selectbox2 = $("<div class='grad__pos select-box' data-type='pos-y' data-target='bg_position'></div>"),
        selected1 = $("<div class='bg-selected'></div>"),
        selected2 = $("<div class='bg-selected'></div>");

    data.options = ["left", "right", "center", "px", "em", "%"];
    data.value = k.bg_pos_value1;
    data.unit = k.bg_pos_u1;
    r.elem1 = this.createBgElem(data, selectbox1, selectbox2, selectmenu1, selectmenu2, spinner1, spinner2, selected1, selected2, container);

    data.options = ["top", "bottom", "center", "px", "em", "%"];
    data.value = k.bg_pos_value2;
    data.unit = k.bg_pos_u2;
    r.elem2 = this.createBgElem(data, selectbox2, selectbox1, selectmenu2, selectmenu1, spinner2, spinner1, selected2, selected1, container);

    r.spinner1 = spinner1;
    r.spinner2 = spinner2;
    r.selected1 = selected1;
    r.selected2 = selected2;
    return r;
}

G.prototype.createRepeat = function(value, container) {


    value = value.replace(/\s/g, "");
    var id = this.id,
        bg_repeat = $("<div class='grad__repeat'></div>"),
        selected = $("<div class='repeat-selected' title='" + value + "'></div>");
    bg_repeat.append(selected);

    var prop = ["repeat", "repeat-x", "repeat-y", "no-repeat"];
    var pos = ["-252px 0", "-294px 0", "-336px 0", "-168px 0"];
    var s = prop.indexOf(value);

    selected.data("index", s);
    selected.css("background-position", pos[s]);
    selected.click(function() {

        if (container.hasClass("freeze")) {
            return;
        }
        var i = $(this).data("index");

        if (i === 3) {
            i = 0;
        } else if (i > -1) {
            i = i + 1;
        }

        selected.data("index", i);
        selected.attr("title", prop[i]);
        var nx = gradient.gradientIndex[id];
        nx.bg_repeat = prop[i];
        selected.css("background-position", pos[i]);
        _updateGradientCSS(["bg_repeat"]);
    });
    return bg_repeat;
}

G.prototype.createParse = function(id, container, preview) {
    var gradientAux, holder = $("<div class='grad__preview gradient-background'></div>");
    holder.append(preview);
    preview.click(function() {
        if (container.hasClass("freeze")) {
            return;
        }

        gradient.saveHSLStops();
        $(".grad").removeClass("grad--selected");
        container.addClass("grad--selected");
        //if (gradientAux.parse) {
        gradientAux = _secLoadGrad(id);
        gradient = gradientAux;
        _newGrad();
        _updateGradientCSS(["bg_image"]); /////--------------------------------------new grad
        //}
    });
    return holder;
}

function _secLoadGrad(id) {
    var holder = $(".grads__container").sortable("toArray");
    return new GradientCSS({
        "css": gradient.gradientIndex,
        "color": gradient.backgroundColor,
        "priority": id,
        "order": holder,
        "format": gradient.format
    });
}

G.prototype.createHide = function(id, container) {
    var $this = this,
        hide = $("<input class='grad__hide' type='checkbox' title='hide'/>");
    hide.change(function() {
        console.log("change");
        var selectbox1 = $this.size,
            selectbox2 = $this.pos,
            nx = gradient.gradientIndex[id];
        if (hide.is(":checked")) {
            console.log("checked");
            nx.visible = false;
            $(".grad__css-container").remove();
            $(".grad__view-css").removeClass("is-checked");
            container.addClass("freeze");
            selectbox1.spinner1.spinner("disable");
            selectbox1.spinner2.spinner("disable");
            selectbox2.spinner1.spinner("disable");
            selectbox2.spinner2.spinner("disable");
        } else {
            nx.visible = true;
            container.removeClass("freeze");
            selectbox1.spinner1.spinner("enable");
            selectbox1.spinner2.spinner("enable");
            selectbox2.spinner1.spinner("enable");
            selectbox2.spinner2.spinner("enable");
        }
        _updateGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat"]);
    });
    return hide;
}

G.prototype.createRemove = function(container) {
    var id = this.id,
        remove = $("<div class='grad__remove' title='remove'></div>");
    console.log(id);
    remove.click(function() {
        console.log(id);
        console.log(gradient.priority);
        console.log(gradient.order);
        if (id === gradient.priority) {

            var index1, index2, index3, max, nextGrad, gradientAux;
            index1 = gradient.order.indexOf(id.toString());
            max = gradient.order.length - 1;

            if (index1 === 0 && max === 0) {
                console.log("llll");
                return;
            } else if (index1 === max) {
                console.log("max");
                index2 = index1 - 1;
                index3 = parseFloat(gradient.order[index2]);
                nextGrad = gradient.gradientIndex[index3].bg_elem;
                nextGrad.addClass("grad--selected");
                gradientAux = _secLoadGrad(index3);
                if (gradientAux.parse) {
                    gradient = gradientAux;
                    _newGrad();
                }
            } else if (index1 < max) {
                console.log("greater");
                index2 = index1 + 1;
                index3 = parseFloat(gradient.order[index2]);
                nextGrad = gradient.gradientIndex[index3].bg_elem;
                nextGrad.addClass("grad--selected");
                gradientAux = _secLoadGrad(index3);
                if (gradientAux.parse) {
                    gradient = gradientAux;
                    _newGrad();
                }
            }
        }
        container.remove();
        _updateContainer();
    });
    return remove;
}

function _updateContainer() {
    gradient.order = $(".grads__container").sortable("toArray");
    _updateGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]);
}

G.prototype.createView = function(id, cssvalue, bg_size_value, bg_pos_value, bg_repeat_value, container) {
    var view = $("<div class='grad__view-css' title='view CSS code'></div>");
    view.click(function() {

        if (container.hasClass("freeze")) {
            return;
        }

        if ($(this).hasClass("is-checked")) {
            $(this).removeClass("is-checked");
            $(".grad__css-container").remove();
        } else {
            console.log("else");
            $(".grad__css-container").remove();
            $(".grad__view-css").removeClass("is-checked");
            $(this).addClass("is-checked");

            var d = gradient.gradientIndex[id],
                css_container = $("<div class='grad__css-container'></div>"),
                css_container_close = $("<button style='float: right;'>close</button>"),
                css_container_codes = $("<div class='grad__css' id='js-copy-" + id + "'><div>background-image: " + d.bg_image + ";</div><div>background-size: " + d.bg_size + ";</div><div>background-position: " + d.bg_position + ";</div><div>background-repeat: " + d.bg_repeat + ";</div></div>"),
                css_container_copy = $("<button class='grad__css__copy' data-clipboard-action='copy' data-clipboard-target='#js-copy-" + id + "'>copy</button>");

            css_container_close.click(function() {
                css_container.hide();
                view.removeClass("is-checked");
            });

            css_container.append(css_container_codes);
            css_container.append(css_container_copy)
            css_container.append(css_container_close);
            container.append(css_container);
            console.log(css_container);
            console.log(container);
        }
    });
    return view;
}

//////////////////////////////////////////-----------------------------------------------------------------------------------////
$(document).ready(function() {
    addAMark = true;
    gradient = firstLoad();
    gradient.showAllColorStops();
    gradient.updateGradientEditor();
    gradient.updateGradientPreview();
    _sliderBarsHSL();
    _createColorSetting();
    _createColorSetting();
    _createSizeSetting();
    _createPosSetting();
    _createAngSetting();
    _deleteAllGradientsFromLocalStorage();
    //_importAllGradientsFromLocalStorage();
    _resetPanel();
    _initSettings();
    _updateGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]);
    new ClipboardJS("#get-copy-css");
    new ClipboardJS(".grad__css__copy");
});

function firstLoad() {
    var hash = window.location.hash;
    if (hash && hash.length > 0) {
        hash = unescape(hash);
        hash = hash.replace(/\\/g, ''); //////////////////////////////////////
        hash = hash.replace(/'/g, ''); /////////////////////////////////////
        hash = hash.substr(1);
        $(".current").attr("style", hash); ///fall back
        console.log(hash);
        //history.pushState(null, null, "#");
    }
    var gr = loadGradient($(".current"), "rgba");
    return gr;
}

function _updateGradientCSS(properties) {
    var order = gradient.order,
        index = gradient.gradientIndex,
        l = order.length,
        i, j, value,
        property, x;
    x = properties.length;

    for (i = 0; i < x; i++) {
        value = "";
        property = properties[i];

        if (property === "bg_color") {
            var color = parseColor(gradient.backgroundColor),
                colorRgb = color.displayColor("rgba");
            color = color.displayColor(gradient.format); //------------------------------------------

            for (j = 0; j < l; j++) {
                index[order[j]].mini_preview.css("background-color", colorRgb);
            }
            _updateHTMLCode(property, color);
            continue;
        }

        for (j = 0; j < l; j++) {
            if (index[order[j]].visible === false) {
                continue;
            }
            value += ", " + index[order[j]][property];
        }
        console.log(value);
        value = value.substring(2);
        console.log(value);
        _updateHTMLCode(property, value);
    }
}

function _updateHTMLCode(property, value) {
    property = property.replace("bg_", "background-");
    PREVIEW.css(property, value);
    $(".current").css(property, value);
    $("#show-code-" + property).html("<b>" + property + ": </b>" + value + ";");
}

function _getGradientCSS(properties) {
    var property, value, a;
    a = {};

    var i, j,
        order = gradient.order,
        index = gradient.gradientIndex,
        orderLength = order.length,
        propsLength = properties.length;

    for (i = 0; i < propsLength; i++) {
        property = properties[i];

        if (property === "bg_color") {
            var color = parseColor(gradient.backgroundColor),
                colorRgb = color.displayColor("rgba");
            color = color.displayColor(gradient.format); //------------------------------------------
            a["bg_color"] = color;
            continue;
        }
        value = "";

        for (j = 0; j < orderLength; j++) {
            if (index[order[j]].visible === false) {
                continue;
            }
            value += ", " + index[order[j]][property];
        }
        console.log(value);
        value = value.substring(2);
        a[property] = value;
    }
    return a;
}

$(".setting__value").click(function(e) {
    var type, value, $this;
    $this = $(this);
    type = $this.data("type");
    value = $this.data("value");

    if (value || type === "repeat") {
        gradient[type] = value;
    }
    gradient.updateGradientPreview();
    _updateGradientCSS(["bg_image"]);
    $(".setting__value[data-type='" + type + "']").removeClass("setting__value--active");
    $this.addClass("setting__value--active");
    //e.preventDefault();//--------------------------------------------------------------
});

$(".setting__value[data-type='type']").click(function() {
    _updateTypeSetting();
});

$(".setting__value[data-type='radialShape'][data-value='circle']").click(function() {
    $("#sy").hide();
    $("#radial-vertical-size-unit").hide();
    $("#radial-horizontal-size-unit option[value=p]").hide();
});

$(".setting__value[data-type='radialShape'][data-value='ellipse']").click(function() {
    $("#sy").show();
    $("#radial-vertical-size-unit").show();
    $("#radial-horizontal-size-unit option[value=p]").show();
});

$("#color-location").on("keyup", function(e) {
    gradient.saveHSLStops();
    var position = _getFromField($(this).val(), 0, 100, $("#color-location"));
    _refreshLocation(_getActiveElement(), parseInt(position), gradient);
    e.preventDefault(); //--------------------------------------------------------------
    return false;
});

$("#color-location").spinner({
    min: 0,
    max: 100,
    spin: function(e, ui) {
        gradient.saveHSLStops();
        _refreshLocation(_getActiveElement(), ui.value, gradient);
        $("#color-location-slider-bar").slider("value", ui.value);
    },
});

$("#color-location-slider-bar").slider({
    value: 100,
    min: 0,
    max: 100,
    step: 1,
    slide: function(event, ui) {
        gradient.saveHSLStops();
        $("#color-location").val(ui.value);
        _refreshLocation(_getActiveElement(), ui.value, gradient);
    },
});

$("#color-delete-button").click(function(e) {
    gradient.saveHSLStops();
    var activeElement = $(".stop-markers .selected");
    if (activeElement.length === 0) {
        return false;
    }
    var location = parseInt(activeElement.attr("position")), //why int?
        oldColor = parseColor(activeElement.attr("color"));
    //oldColor.changeFormatColor(gradient.format);
    if (location || location === 0) {
        if (gradient.removeStopMarker(gradient.colorStops, location, oldColor)) {
            gradient.updateGradientPreview();
            gradient.updateGradientEditor();
            _updateGradientCSS(["bg_image"]);
            activeElement.remove();
        }
    }
    var c = _getActiveElement().attr("position");
    $("#color-location").val(parseFloat(c)); //------------------------parsefloat
    $("#color-value-button").spectrum("hide");
    return false;
});

$(".stop-markers").click(function(e) {
    if (addAMark) {
        var color, position, colorString;
        gradient.saveHSLStops();
        position = _calculatePosition(e.clientX - (this.offsetParent.offsetLeft + this.offsetLeft), gradient.widthDefault);
        colorString = $("#color-value-button").spectrum("get").toRgbString();
        if (colorString) {
            var color = parseColor(colorString);
            console.log(color);
        } else {
            color = gradient.colorStops[0].color.clone();
        }
        console.log(position);
        //color.changeFormatColor(gradient.format);
        gradient.addStopMarker(gradient.colorStops, { "color": color, "location": position });
        gradient.updateGradientEditor();
        gradient.updateGradientPreview();
        gradient.showAllColorStops();
        _updateGradientCSS(["bg_image"]);
        _selectAMark();
    }
    addAMark = true;
    e.stopPropagation();
});

$(".stop-markers").on("click", ".color-knob", function(e) {
    gradient.saveHSLStops();
    addAMark = false;
    var activeElement = _getActiveElement(),
        color = $(this).attr("color");
    activeElement.removeClass("selected");
    $(this).addClass("selected");
    _selectAMark();
    $("#color-value-button").spectrum("set", color);
    $("#color-value-button").spectrum("toggle");
    return false;
});

$("#reset-button").click(function() {
    $(".grads__container").html("");
    $(".current").css("background", "repeating-radial-gradient(ellipse farthest-corner at left top, rgba(0,165,223,1) 0%, rgba(62,20,123,1) 20%, rgba(226,0,121,1) 40%, rgba(223,19,44,1) 60%, rgba(243,239,21,1) 80%, rgba(0,152,71,1) 100%)");
    gradient = loadGradient($(".current"), gradient.format);
    gradient.showAllColorStops();
    gradient.updateGradientEditor();
    gradient.updateGradientPreview();
    _updateGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]);
    _resetPanel();
    _initSettings();
});

$(".reverse-btn").click(function() {
    gradient.saveHSLStops();
    gradient.reverseGradient();
    _selectAMark();
});

$("#add-gradient-accept").click(function() {
    var a, b, c, css, id = gradient.gradientIndex.length;
    css = _formatCss($(".add-gradient__input").val(), $("#test"));
    console.log(css);
    c = _CSSValueParser(css, id - 1);
    b = c.bg_prop.length;
    console.log(c);
    for (a = 0; a < b; a++) {
        gradient.gradientIndex.push(c.bg_prop[a]);
    }
    _updateContainer();
    //$("#add-gradient-input").val("");
    $(".add-gradient").hide();
});

$("#import-css-button-ok").click(function() {
    $(".grads__container").html("");
    var style, value, options, gradientAux;
    value = _formatCss($("#import-css-area").val(), $("#test"));
    console.log(value);
    style = _CSSValueParser(value, -1);
    options = {
        "css": style.bg_prop,
        "color": value.e,
    };
    gradientAux = new GradientCSS(options);
    //if (gradientAux.parse) {
    gradient = gradientAux;
    _newGrad();
    _updateContainer();
    $(".grad").first().addClass("grad--selected");
    //} else {
    //    alert("Couldn\"t parse gradient CSS.\nPlease check the format and try again.");
});

$(".presets-list").on("click", ".load-preset", function() {
    console.log("click");
    $(".grads__container").html("");
    $(".load-preset").removeClass("actual");
    $(this).addClass("actual");
    var gradientAux = loadGradient($(this), gradient.format);
    //if (gradientAux.parse) {
    gradient = gradientAux;
    _newGrad();
    _updateGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]);
    $(".add-gradient").hide();
    $(".adjust-color").hide();
    //} else {
    //alert("The gradient selected was not able to load properly.");
    //}
});

$(".codepen").click(function() {
    var c = gradient.showFormatColor(gradient.format),
        d = _getGradientCSS(["bg_size", "bg_position", "bg_repeat", "bg_color"]),
        HTML = "<div id='gradient'></div>",
        JS = "",
        CSS = "#gradient {\n  width: 628px;\n  height: 400px;\n background-image: " + c + ";\n  background-size:" + d.bg_size + ";\n  background-position:" + d.bg_position + ";\n  background-repeat:" + d.bg_repeat + ";\n background-color: " + d.bg_color + ";\n}",
        data = { title: "Cool Gradient", description: "", html: HTML, html_pre_processor: "none", css: CSS, css_pre_processor: "none", css_starter: "neither", css_prefix_free: false, js: JS, js_pre_processor: "none", js_modernizr: false, js_library: "", html_classes: "", css_external: "", js_external: "", template: true },
        JSONstring = JSON.stringify(data).replace(/"/g, "&quot;").replace(/'/g, "&apos;"),
        form = $('<form action="https://codepen.io/pen/define" method="POST" target="_blank" id="pen-define">' + '<input type="hidden" name="data" value=\'' + JSONstring + '\'>' + '</form>');
    $(this).append(form);
    form.submit();
});

$("#get-css-btn").click(function() {
    $("#get-css-dialog").dialog("open");
});

$("#import-css-btn").click(function() {
    $("#import-css-dialog").dialog("open");
});

$("#get-css-dialog").dialog({
    maxWidth: 600,
    width: "auto",
    autoOpen: false
});

$("#import-css-dialog").dialog({
    maxWidth: 600,
    width: "auto",
    autoOpen: false
});

$("#report-bug-btn").click(function() {
    var value = "file:///home/ko_ko/Downloads/gradient-editor/gradient-editor/contact.html";
    window.open(value);
});

PREVIEW.resizable({
    resize: function(event, ui) {
        var w = $(this).width(),
            h = $(this).height();
        $("#resizable-width").val(w);
        $("#resizable-height").val(h);
    }
});

$(".add-gradient").hide();
$(".adjust-color").hide();

$("#add-gradient-cancel").click(function() {
    $(".add-gradient").hide();
});

$("#add-gradient-btn").click(function() {
    $(".adjust-color").hide();
    $(".add-gradient").show();
});

$("#adjust-color-btn").click(function() {
    $(".add-gradient").hide();
    $(".adjust-color").show();
});

$("#adjust-color-accept").click(function() {
    gradient.saveHSLStops();
    $(".adjust-color").hide();
});

$("#adjust-color-cancel").click(function() {
    gradient.updateHSLLevels(0, 0, 0);
    _resetPanel();
    $(".adjust-color").hide();
});

$("#resizable-width").on("keyup", function() {
    $("#gradient-preview .gradient-real").css("width", $(this).val());
});

$("#resizable-height").on("keyup", function() {
    $("#gradient-preview .gradient-real").css("height", $(this).val());
});

$(document).click(function(e) {
    var target = e.target;
    if ($(target).hasClass("bg-selected")) {
        $(".grad__css-container").remove();
        $(".grad__view-css").removeClass("is-checked");

    } else if ($(target).hasClass("grad__view-css")) {
        $(".bg-options").hide();

    } else {
        //_closeAllDropDowns();
        $(".bg-options").hide();
    }
});

$(".panel__toggle").click(function() {
    var $this = $(this),
        p = $this.parent().next();
    if (($this).hasClass("toggle-on")) {
        $this.removeClass("toggle-on");
        $this.addClass("toggle-off");
        p.hide();
    } else {
        $this.removeClass("toggle-off");
        $this.addClass("toggle-on");
        p.show();
    }
});

function loadGradient(elementHTML, format) {
    console.log(elementHTML)
    var style, order, value = {};
    value.a = elementHTML.css("background-image");
    value.b = elementHTML.css("background-position");
    value.c = elementHTML.css("background-size");
    value.d = elementHTML.css("background-repeat");
    value.e = elementHTML.css("background-color");
    console.log(value.a);
    console.log(value.e);
    style = _CSSValueParser(value, -1);
    console.log(style);
    order = $(".grads__container").sortable("toArray");
    style.bg_prop[0].bg_elem.addClass("grad--selected"); //--------------------
    console.log(style.bg_prop);
    return new GradientCSS({
        "css": style.bg_prop,
        "color": value.e,
        "order": order,
        "format": format
    });
}

function _formatCss(CSSvalue, test) {
    var value = {};
    test.attr("style", CSSvalue);
    value.a = test.css("background-image");
    value.b = test.css("background-position");
    value.c = test.css("background-size");
    value.d = test.css("background-repeat");
    value.e = test.css("background-color");
    console.log(value);
    return value;
}

function _newGrad() {
    gradient.updateGradientEditor();
    gradient.updateGradientPreview(); //------------------------------->
    gradient.showAllColorStops();
    _resetPanel();
    _initSettings();
}

function _getActiveElement() {
    var element;
    element = $(".stop-markers .selected");
    if (element.length === 0) {
        element = $($(".stop-markers .stop-marker")[0]);
        element.addClass("selected");
    }
    return element;
}

function updateInfo(color) {
    var colorRgba, activeElement = _getActiveElement(),
        location = parseFloat(activeElement.attr("position")),
        mark = gradient.getStopMarker(location, true);

    if (mark) {
        colorRgba = color.displayColor("rgba");
        //color.changeFormatColor(mark.color.format);
        mark.color = color;
        mark.htmlBlock.attr("color", colorRgba);
        activeElement.children().css("background-color", colorRgba);
        gradient.updateGradientPreview();
        gradient.updateGradientEditor();
        _updateGradientCSS(["bg_image"]);
    }
}

function _selectAMark() {
    var element = _getActiveElement(),
        location = element.attr("position");
    $("#color-location").val(location);
    $("#color-location-slider-bar").slider("value", location);
}

function _createColorSetting() {
    $("#color-value-button").spectrum({
        preferredFormat: "rgb",
        showAlpha: true,
        showInput: true,
        showPalette: true,
        palette: [
            ["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"],
        ],
        change: function(color) {
            var rgb = color.toRgbString(),
                pc = parseColor(rgb);
            updateInfo(pc);
            console.log(pc);
        },
        move: function(color) {
            var rgb = color.toRgbString(),
                pc = parseColor(rgb);
            updateInfo(pc);
        },
        show: function() {
            var elem = _getActiveElement(),
                left = elem.offset().left,
                top = elem.offset().top + 52,
                container = $("#color-value-button").spectrum("container");
            container.css("top", top + "px");
            container.css("left", left + "px");
            gradient.saveHSLStops();
        },
    });

    $("#background-color").spectrum({
        preferredFormat: "rgb",
        showAlpha: true,
        showInput: true,
        showPalette: true,
        palette: [
            ["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"],
        ],
        change: function(color) {
            var rgba = color.toRgbString();
            gradient.backgroundColor = rgba;
            _updateGradientCSS(["bg_color"]);
        },
        move: function(color) {
            var rgba = color.toRgbString();
            gradient.backgroundColor = rgba;
            _updateGradientCSS(["bg_color"]);
        },
    });
}

function _createSizeSetting() {
    $("#sx").spinner({
        min: 0,
        max: 999,
        value: 0,
        spin: function(e, ui) {
            var value1 = ui.value,
                value2 = $("#sy").val(),
                unit1 = $("#radial-horizontal-size-unit").val(),
                unit2 = $("#radial-vertical-size-unit").val();
            _updateRadialHorizontalSize(value1, value2, unit1, unit2);
        }
    });

    $("#sy").spinner({
        min: 0,
        max: 999,
        value: 0,
        spin: function(e, ui) {
            var value1 = ui.value,
                value2 = $("#sx").val(),
                unit1 = $("#radial-vertical-size-unit").val(),
                unit2 = $("#radial-horizontal-size-unit").val();
            _updateRadialVerticalSize(value1, value2, unit1, unit2);
        }
    });

    $("#sx").on("keyup", function() {
        var value1 = _getFromField($(this).val(), -999, 999, $("#sx")),
            value2 = $("#sy").val(),
            unit1 = $("#radial-horizontal-size-unit").val(),
            unit2 = $("#radial-vertical-size-unit").val();
        _updateRadialHorizontalSize(value1, value2, unit1, unit2);
    });

    $("#sy").on("keyup", function() {
        var value1 = _getFromField($(this).val(), -999, 999, $("#sy")),
            value2 = $("#sx").val(),
            unit1 = $("#radial-vertical-size-unit").val(),
            unit2 = $("#radial-horizontal-size-unit").val();
        _updateRadialVerticalSize(value1, value2, unit1, unit2);
    });

    $("#radial-horizontal-size-unit").on("change", function() {
        console.log("change1111");
        var value = $(this).val();
        if (value === "p") {
            value = "%";
        }
        console.log(gradient);
        gradient.radialHorizontalSizeUnit = value;
        gradient.updateGradientPreview();
        _updateGradientCSS(["bg_image"]);
    });

    $("#radial-vertical-size-unit").on("change", function() {
        console.log("change1111");
        var value = $(this).val();
        if (value === "p") {
            value = "%";
        }
        console.log(gradient);
        gradient.radialVerticalSizeUnit = value;
        gradient.updateGradientPreview();
        _updateGradientCSS(["bg_image"]);
    });

    function _updateRadialHorizontalSize(value1, value2, unit1, unit2) {
        $(".setting__value[data-type='radialSize']").removeClass("setting__value--active");
        if (unit1 === "p") {
            unit1 = "%";
        }
        if (unit2 === "p") {
            unit2 = "%";
        }
        if (gradient.radialShape === "circle") {
            gradient.radialHorizontalSize = value1;
            gradient.radialHorizontalSizeUnit = unit1;
            gradient.radialVerticalSize = value1;
            gradient.radialVerticalSizeUnit = unit1;
            gradient.radialSize = value1 + unit1;
            $("#radial-horizontal-size-unit").addClass("setting__value--active");
        } else {
            gradient.radialHorizontalSize = value1;
            gradient.radialHorizontalSizeUnit = unit1;
            gradient.radialVerticalSize = value2;
            gradient.radialVerticalSizeUnit = unit2;
            gradient.radialSize = value1 + unit1 + " " + value2 + unit2;
            $("#radial-horizontal-size-unit").addClass("setting__value--active");
            $("#radial-vertical-size-unit").addClass("setting__value--active");
        }
        //gradient.saveHSLStops();
        gradient.updateGradientPreview();
        _updateGradientCSS(["bg_image"]);
    }

    function _updateRadialVerticalSize(value1, value2, unit1, unit2) {
        if (unit1 === "p") {
            unit1 = "%";
        }
        if (unit2 === "p") {
            unit2 = "%";
        }
        gradient.radialHorizontalSize = value2;
        gradient.radialHorizontalSizeUnit = unit2;
        gradient.radialVerticalSize = value1;
        gradient.radialVerticalSizeUnit = unit1;
        gradient.radialSize = value2 + unit2 + " " + value1 + unit1;
        gradient.updateGradientPreview();
        _updateGradientCSS(["bg_image"]);
        $(".setting__value[data-type='radialSize']").removeClass("setting__value--active");
        $("#radial-horizontal-size-unit").addClass("setting__value--active");
        $("#radial-vertical-size-unit").addClass("setting__value--active");
    }
}

function _createPosSetting() {
    var elements1 = [$("#rpx"), $("#rpy"), $("#cx"), $("#cy")],
        elements2 = [$("#radial-horizontal-position-unit"), $("#radial-vertical-position-unit"), $("#conic-horizontal-position-unit"), $("#conic-vertical-position-unit")],
        code1 = ["radialHorizontalPosition", "radialVerticalPosition", "conicHorizontalPosition", "conicVerticalPosition"],
        code2 = ["radialHorizontalPositionUnit", "radialVerticalPositionUnit", "conicHorizontalPositionUnit", "conicVerticalPositionUnit"];

    var k, m = elements1.length;
    for (k = 0; k < m; k++) {
        _createPositionElems(elements1[k], elements2[k], code1[k], code2[k]);
    }

    function _createPositionElems(elem1, elem2, target1, target2) {
        elem1.spinner({
            min: -999,
            max: 999,
            value: 0,
            spin: function(e, ui) {
                var value = ui.value;
                var unit = elem2.val();
                if (unit === "p") {
                    unit = "%";
                }
                gradient[target1] = value;
                gradient[target2] = unit;
                gradient.updateGradientPreview();
                _updateGradientCSS(["bg_image"]);
                $(".setting__value[data-type='" + target1 + "']").removeClass("setting__value--active");
                elem2.addClass("setting__value--active");
            }
        });

        elem1.on("keyup", function() {
            var key = $(this).val();
            var value = _getFromField(key, -999, 999, elem1);
            var unit = elem2.val();
            if (unit === "p") {
                unit = "%";
            }
            gradient[target1] = value;
            gradient[target2] = unit;
            gradient.updateGradientPreview();
            _updateGradientCSS(["bg_image"]);
        });

        elem2.on("change", function() {
            var value = $(this).val();
            if (value === "p") {
                value = "%";
            }
            gradient[target2] = value;
            gradient.updateGradientPreview();
            _updateGradientCSS(["bg_image"]);
        });
    }
}

function _createAngSetting() {
    function _updateAngleValue(value, target) {
        if (target === "linearOrientation") {
            $(".setting__value[data-type='linearOrientation']").removeClass("setting__value--active");
            $("#linear-angle-picker").addClass("anglepicker--active");
        }
        gradient[target] = value;
        gradient.updateGradientPreview();
        _updateGradientCSS(["bg_image"]);
    }
    var elements3 = [$("#linear-angle-value"), $("#conic-angle-value")],
        elements4 = [$("#linear-angle-picker"), $("#conic-angle-picker")],
        code2 = ["linearOrientation", "conicStartAngle"];
    var j, n = elements3.length;
    for (j = 0; j < n; j++) {
        _createAngleValueElems(elements3[j], elements4[j], code2[j]);
    }

    function _createAngleValueElems(elem1, elem2, code) {
        elem2.anglepicker({
            value: 0,
            change: function(e, ui) {
                console.log("trigger");
                var value = ui.value;
                _updateAngleValue(value, code);
                elem1.val(value);
            },
        });

        elem1.on("keyup", function(e) {
            var value = _getFromField($(this).val(), 0, 360, elem1);
            _updateAngleValue(value, code);
            elem2.anglepicker("value", value);
        });

        elem1.spinner({
            min: 0,
            max: 360,
            value: 0,
            spin: function(e, ui) {
                var value = ui.value;
                _updateAngleValue(value, code);
                elem2.anglepicker("value", value);
            },
        });
    }
}

function _sliderBarsHSL() {
    var HslFunctions = [
        function(value) {
            var h = parseFloat(value),
                s = parseFloat($("#saturation").val()),
                l = parseFloat($("#lightness").val());
            _updateSaturationSlider($("#saturation-bar"), Math.round((h + 360 + 180) % 360), Math.round((l + 100) / 2));
            _updateLightnessSlider($("#lightness-bar"), Math.round((h + 360 + 180) % 360), Math.round((s + 100) / 2));
            gradient.updateHSLLevels(h, s, l);
        },
        function(value) {
            var h = parseFloat($("#hue").val()),
                s = parseFloat(value),
                l = parseFloat($("#lightness").val());
            _updateLightnessSlider($("#lightness-bar"),
                Math.round((h + 360 + 180) % 360),
                Math.round((s + 100) / 2));
            _updateHueSlider($("#hue-bar"),
                Math.round((s + 100) / 2),
                Math.round((l + 100) / 2));
            gradient.updateHSLLevels(h, s, l);
        },
        function(value) {
            var h = (parseFloat($("#hue").val()) + 360) % 360,
                s = parseFloat($("#saturation").val()),
                l = parseFloat(value);
            _updateSaturationSlider($("#saturation-bar"),
                Math.round((h + 360 + 180) % 360),
                Math.round((l + 100) / 2));
            _updateHueSlider($("#hue-bar"),
                Math.round((s + 100) / 2),
                Math.round((l + 100) / 2));
            gradient.updateHSLLevels(h, s, l);
        },
        function(value) {
            //gradient.updateOpacityLevels(value);
        }
    ];

    var elements = ["hue", "saturation", "lightness", "opacity"],
        min = [-180, -100, -100, 0],
        max = [180, 100, 100, 100];
    var i, l = elements.length;
    for (i = 0; i < l; i++) {
        _createHslElems(elements[i], min[i], max[i], HslFunctions[i], i);
    }

    function _createHslElems(element, min, max, fun, index) {
        $("#" + element).on("keyup", function(e) {
            var value = _getFromField($(this).val(), -180, 180, $("#" + element));
            $("#" + element + "-bar").slider("value", value);
            HslFunctions[index](value);
        });

        $("#" + element).spinner({
            value: 0,
            min: min,
            max: max,
            step: 1,
            spin: function(event, ui) {
                var value = ui.value;
                $("#" + element + "-bar").slider("value", value);
                HslFunctions[index](value);
            },
        });

        $("#" + element + "-bar").slider({
            value: 0,
            min: min,
            max: max,
            step: 1,
            slide: function(event, ui) {
                var value = ui.value;
                $("#" + element).val(value);
                HslFunctions[index](value);
            },
        });
    }
    $("#opacity-bar").slider("option", "disabled", true);
}


function _updateHueSlider(hueHTML, saturation, lightness) {
    var hue, pos, point = [],
        aux4 = "",
        numColors = 6;
    point = ["hsl(" + 0 + ", " + saturation + "%," + lightness + "%) ", "0%"];
    aux4 += "linear-gradient(to right, " + point[0] + "0%";
    for (var i = 1; i <= numColors; i++) {
        hue = Math.round((i / numColors) * 360.0);
        pos = Math.round((i / numColors) * 100.0);
        point = ["hsl(" + hue + "," + saturation + "%," + lightness + "%) ", pos + "%"];
        aux4 += ", " + point[0] + point[1];
    }
    aux4 += ")";
    hueHTML.css("background", aux4);
}

function _updateLightnessSlider(lightnessHTML, hue, saturation) {
    var aux4, start = ["hsl(" + hue + "," + saturation + "%," + 0 + "%)", "0%"],
        end = ["hsl(" + hue + "," + saturation + "%," + 100 + "%)", "100%"];
    aux4 = "linear-gradient(to right, " + start[0] + start[1];
    aux4 += ", " + end[0] + end[1] + ")";
    lightnessHTML.css("background", aux4);
}

function _updateSaturationSlider(saturationHTML, hue, lightness) {
    var aux4, start = ["hsl(" + hue + "," + 0 + "%," + lightness + "%)", "0%"],
        end = ["hsl(" + hue + "," + 100 + "%," + lightness + "%)", "100%"];
    aux4 = "linear-gradient(to right, " + start[0] + start[1];
    aux4 += ", " + end[0] + end[1] + ")";
    saturationHTML.css("background", aux4);
}

function _linearSettingReset() {
    var value = gradient.linearOrientation;
    console.log(value);
    $(".setting__value[data-type='linearOrientation']").removeClass("setting__value--active");
    if (typeof value === "number") {
        if (Math.sign(value) === -1) {
            value = 360 + value;
        }
        $("#linear-angle-picker").anglepicker("value", value);
        $("#linear-angle-value").val(value);
        $("#linear-angle-picker").addClass("anglepicker--active");
    } else {
        $(".setting__value[data-type='linearOrientation'][data-value='" + value + "']").addClass("setting__value--active");
        $("#linear-angle-picker").removeClass("anglepicker--active");
    }
}

function _RadialSettingReset() {
    var shape = gradient.radialShape,
        size = gradient.radialSize,
        rhs = gradient.radialHorizontalSize,
        rvs = gradient.radialVerticalSize,
        rhsu = gradient.radialHorizontalSizeUnit,
        rvsu = gradient.radialVerticalSizeUnit,
        rhp = gradient.radialHorizontalPosition,
        rvp = gradient.radialVerticalPosition,
        rhpu = gradient.radialHorizontalPositionUnit,
        rvpu = gradient.radialVerticalPositionUnit;
    $(".setting__value[data-type='radialShape']").removeClass("setting__value--active");
    $(".setting__value[data-type='radialSize']").removeClass("setting__value--active");
    $(".setting__value[data-type='radialHorizontalPosition']").removeClass("setting__value--active");
    $(".setting__value[data-type='radialVerticalPosition']").removeClass("setting__value--active");

    if (shape === "circle") {
        $("#sy").hide();
        $("#radial-vertical-size-unit").hide();
        $("#radial-horizontal-size-unit option[value=p]").hide();

    } else {
        $("#sy").show();
        $("#radial-vertical-size-unit").show();
        $("#radial-horizontal-size-unit option[value=p]").show();
    }
    $(".setting__value[data-type='radialShape'][data-value='" + shape + "']").addClass("setting__value--active");
    console.log(size);
    if (size.match(/closest-side|closest-corner|farthest-side|farthest-corner/)) {

        $("#sx").val(0);
        $("#sy").val(0);
        $(".setting__value[data-type='radialSize'][data-value='" + size + "']").addClass("setting__value--active");

    } else {
        if (rhsu === "%") {
            rhsu = "p";
        }
        if (rvsu === "%") {
            rvsu = "p";
        }
        $("#sx").val(rhs);
        $("#sy").val(rvs);
        $("#radial-horizontal-size-unit option[value=" + rhsu + "]")[0].selected = true;
        $("#radial-horizontal-size-unit").addClass("setting__value--active");
        $("#radial-vertical-size-unit option[value=" + rvsu + "]")[0].selected = true;
        $("#radial-vertical-size-unit").addClass("setting__value--active");
    }

    if (typeof rhp === "number") {
        if (rhpu == "%") {
            rhpu = "p";
        }
        $("#rpx").val(rhp);
        $("#radial-horizontal-position-unit option[value=" + rhpu + "]")[0].selected = true;
        $("#radial-horizontal-position-unit").addClass("setting__value--active");
    } else {
        $("#rpx").val(0);
        $(".setting__value[data-type='radialHorizontalPosition'][data-value='" + rhp + "']").addClass("setting__value--active");
    }
    if (typeof rvp === "number") {
        if (rvpu === "%") {
            rvpu = "p";
        }
        $("#rpy").val(rvp);
        $("#radial-vertical-position-unit option[value=" + rvpu + "]")[0].selected = true;
        $("#radial-vertical-position-unit").addClass("setting__value--active");
    } else {
        $("#rpy").val(0);
        $(".setting__value[data-type='radialVerticalPosition'][data-value='" + rvp + "']").addClass("setting__value--active");
    }
}

function _ConicSettingReset() {
    var value = gradient.conicStartAngle,
        chp = gradient.conicHorizontalPosition,
        cvp = gradient.conicVerticalPosition,
        chpu = gradient.conicHorizontalPositionUnit,
        cvpu = gradient.conicVerticalPositionUnit;
    $(".conicHorizontalPosition").removeClass("setting__value--active");
    $(".conicVerticalPosition").removeClass("setting__value--active");

    if (value || value === 0) {
        if (Math.sign(value) === -1) {
            value = 360 + value;
        }
        $("#conic-angle-picker").anglepicker("value", value);
        $("#conic-angle-value").val(value);
    }
    if (typeof chp === "number") {
        if (chpu === "%") {
            chpu = "p";
        }
        $("#cx").val(chp);
        $("#conic-horizontal-position-unit option[value=" + chpu + "]")[0].selected = true;
        $("#conic-horizontal-position-unit").addClass("setting__value--active");
    } else {
        $("#cx").val(0);
        $(".setting__value[data-type='conicHorizontalPosition'][data-value='" + chp + "']").addClass("setting__value--active");
    }

    if (typeof cvp === "number") {
        if (cvpu === "%") {
            cvpu = "p";
        }
        $("#cy").val(cvp);
        $("#conic-vertical-position-unit option[value=" + cvpu + "]")[0].selected = true;
        $("#conic-vertical-position-unit").addClass("setting__value--active");
    } else {
        $("#cy").val(0);
        $(".setting__value[data-type='conicVerticalPosition'][data-value='" + cvp + "']").addClass("setting__value--active");
    }
}

function _updateRepeatSetting() {
    var repeat = gradient.repeat;
    $(".setting__value[data-type='repeat']").removeClass("setting__value--active");
    if (repeat) {
        $(".setting__value[data-type='repeat'][data-value='true']").addClass("setting__value--active");
    } else {
        $(".setting__value[data-type='repeat'][data-value='false']").addClass("setting__value--active");
    }
}

function _updateTypeSetting() {
    var type = gradient.type;
    if (type === "linear") {
        $("#linear-setting-block").show();
        $("#radial-setting-block").hide();
        $("#conic-setting-block").hide();
        _linearSettingReset();
    } else if (type === "radial") {
        $("#radial-setting-block").show();
        $("#linear-setting-block").hide();
        $("#conic-setting-block").hide();
        _RadialSettingReset();
    } else {
        $("#conic-setting-block").show();
        $("#linear-setting-block").hide();
        $("#radial-setting-block").hide();
        _ConicSettingReset();
    }
    $(".setting__value[data-type='type']").removeClass("setting__value--active");
    $(".setting__value[data-type='type'][data-value='" + type + "']").addClass("setting__value--active");
}

$(".setting__value[data-type='linearOrientation']").click(function() {
    $("#linear-angle-picker").removeClass("anglepicker--active");
});

function _initSettings() {
    _updateRepeatSetting();
    _updateTypeSetting();
}

function _resetPanel() {
    var activeElement = _getActiveElement(),
        location = parseFloat(activeElement.attr("position"));
    _resetHslPanel();
    $("#background-color").spectrum("set", gradient.backgroundColor); ///////--------------------
    $("#color-location").val(location);
    $("#color-location-slider-bar").slider("value", location);
    $("#import-css-area").val(""); //////////////////////////
    $("#import-css-dialog").dialog("close");
    $("#hue-bar").css("background-image", "linear-gradient(to right, hsl(0,50%,50%) 0%, hsl(60,50%,50%) 17%, hsl(120,50%,50%) 33%, hsl(180,50%,50%) 50%, hsl(240,50%,50%) 67%, hsl(300,50%,50%) 83%, hsl(0,50%,50%) 100%)");
    $("#saturation-bar").css("background-image", "linear-gradient(to right, hsl(0,0%,50%) 0%, hsl(180,100%,50%) 100%)");
}

function _resetHslPanel() {
    var color = gradient.colorStops[gradient.colorStops.length - 1].color.displayColor("rgba");
    $("#color-value-button").spectrum("set", color);
    $("#hue").val(0);
    $("#saturation").val(0);
    $("#lightness").val(0);
    $("#hue-bar").slider("value", 0);
    $("#saturation-bar").slider("value", 0);
    $("#lightness-bar").slider("value", 0);
}

function _getFromField(value, min, max, elem) {
    var val;
    if (value == "" || value == "-") { //===
        return;
    }
    val = parseFloat(value);
    if (isNaN(val)) {
        val = 0;
    } else if (val < min) {
        val = min;
        value = min;
    } else if (val > max) {
        val = max;
        value = max;
    }
    elem.val(val);
    return val;
}

$("#save-preset-btn").click(function() {
    var swatches16 = localStorage.getItem("swatches16");
    var css = _getGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]);
    var bg_img_css = { v: css.bg_image, w: css.bg_size, x: css.bg_position, y: css.bg_repeat, z: css.bg_color };

    if (!swatches16) {
        var array = [];
        array.push(bg_img_css);
        localStorage.setItem("swatches16", JSON.stringify(array));
        swatches16 = localStorage.getItem("swatches16");
    }

    swatches16 = JSON.parse(swatches16);
    swatches16.push(bg_img_css);
    localStorage.setItem("swatches16", JSON.stringify(swatches16));
    _importGradientFromLocalStorage(swatches16.length - 1, swatches16[swatches16.length - 1]);
});

$("#delete-preset-btn").click(function() {
    var i, item, index, swatches16;
    i = $(".actual").data("index");
    console.log(i);
    if (i === 0 || i) {
        swatches16 = JSON.parse(localStorage.getItem("swatches16"));
        item = swatches16[i];

        index = swatches16.indexOf(item);
        if (index !== -1) {
            swatches16.splice(index, 1);
        }

        localStorage.setItem("swatches16", JSON.stringify(swatches16));
        $(".presets-list").html("");
        _importAllGradientsFromLocalStorage();
    } else {
        alert("Please select a preset to delete");
    }
});

$(".facebook").click(function() {
    var value = "https://www.facebook.com/sharer/sharer.php?u=www.cssgradienteditor.com";
    window.open(value);
});

$(".twitter").click(function() {
    var value = "https://twitter.com/intent/tweet?url=https://www.cssgradienteditor.com&text=";
    window.open(value);
});

$("#color-format").selectmenu({
    change: function() {
        gradient.saveHSLStops();
        var format = $(this).val(); /////
        console.log(format);
        gradient.format = gradient.changeFormatColor(format);
        _updateGradientCSS(["bg_image"]);
    }
});

$("#do").click(function() {
    var activeElement = _getActiveElement(),
        location = activeElement.attr("position");
    console.log(typeof location);
    console.log(_getGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]));
    console.log(gradient.showFormatColor("hex"));
});

$("#format").click(function() {
    $("#dialog-2").dialog("open");
    var t = gradient.showFormatColor("hsla");
    var u = gradient.showFormatColor("hex");
    $("#hsla-format").css("background-image", t);
    $("#hex-format").css("background-image", u);
    var d = _updateGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]);
    $("#hsla-format").css("background-size", d.bg_size);
    $("#hsla-format").css("background-position", d.bg_position);
    $("#hsla-format").css("background-repeat", d.bg_repeat);
    $("#hsla-format").css("background-color", d.bg_color);
    $("#hex-format").css("background-size", d.bg_size);
    $("#hex-format").css("background-position", d.bg_position);
    $("#hex-format").css("background-repeat", d.bg_repeat);
    $("#hex-format").css("background-color", d.bg_color);
    console.log(t);
    console.log(u);
    console.log(CSS.supports("background-image", t));
    console.log(CSS.supports("background-image", u));
});

$("#gradient").click(function() {
    console.log(gradient);
    _updateGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"]);
});

$("#update-value-btn").click(function() {
    var value, d = _getGradientCSS(["bg_image", "bg_size", "bg_position", "bg_repeat", "bg_color"], true);
    value = "background-image:" + d.bg_image + "; background-size:" + d.bg_size + "; background-position:" + d.bg_position + "; background-repeat:" + d.bg_repeat + "; background-color: " + d.bg_color + ";";
    value = escape(value).replace(/%/g, '\\%').replace(/\./g, '\\.').replace(/\-/g, '\\-');
    history.pushState(null, null, '#' + value);
});
console.timeEnd("hex");
var addAMarkMini = true;

function addAGrad() {
    var w = EDITOR.width();
    console.log("xxx" + w);
    this.repeat = false,
        this.type = "linear",
        this.format = "rgba",
        this.widthDefault = w || 560,
        this.colorDefault0 = new UserColor({ "format": "rgba", "color": { "r": 46, "g": 84, "b": 117, "a": 1 } }),
        this.colorDefault1 = new UserColor({ "format": "rgba", "color": { "r": 255, "g": 37, "b": 0, "a": 1 } }),
        this.colorStops = [{
                "color": this.colorDefault0.clone(),
                "location": 10,
                "htmlBlock": _createStopMarkerMini(0, {
                    "color": this.colorDefault0,
                    "location": 10
                }, this.widthDefault)
            },
            {
                "color": this.colorDefault1.clone(),
                "location": 90,
                "htmlBlock": _createStopMarkerMini(1, {
                    "color": this.colorDefault1,
                    "location": 90
                }, this.widthDefault)
            }
        ];
}

addAGrad.prototype.getStopMarker = function(location, slider) {
    var i, c = this.colorStops,
        l = c.length,
        res = false;

    if (slider) {
        for (i = 0; i < l; i++) {
            if (c[i].htmlBlock.hasClass("selected")) {
                res = c[i];
                break;
            }
        }
        return res;
    } else {
        for (i = 0; i < l; i++) {
            if (c[i].location === location) {
                res = c[i];
                break;
            }
        }
        return res;
    }
}

addAGrad.prototype.addStopMarker = function(listElements, mark, specialCase) {
    var c = mark.location,
        i = 0,
        res = [];
    res = res.concat(listElements, [mark]);
    res.sort(function(a, b) {
        return a.location - b.location;
    });
    for (i = 0; i < res.length; i++) {
        if (res[i] === mark) {
            res[i]["htmlBlock"] = _createStopMarkerMini(i, mark, this.widthDefault);
            res[i]["htmlBlock"].addClass("selected");
        } else if (res[i].location >= mark.location) {
            if (res[i]["htmlBlock"]) {
                res[i]["htmlBlock"].removeClass("selected");
                res[i]["htmlBlock"].attr("position", res[i].location);
                res[i]["htmlBlock"].attr("imarker", i);
            } else {
                res[i]["htmlBlock"] = _createStopMarkerMini(i, mark, this.widthDefault);
            }
        } else {
            res[i]["htmlBlock"].removeClass("selected");
        }
    }
    if (specialCase) {
        var r,
            w = [],
            o = [],
            r = res.length;
        for (i = 0; i < r; i++) {
            if (res[i].location === c) {
                w.push(i);
                o.push(res[i]);
            }
        }
        if (w.length > 1) {
            var j, q = o.length;
            o.unshift(o.pop());
            for (j = 0; j < q; j++) {
                res[w[j]] = o[j];
            }
        }
    }
    this.colorStops = res;
}

addAGrad.prototype.removeStopMarker = function(listElements, location, value) {
    var i, k, res, cond, l = listElements.length,
        elem = false;

    if (listElements.length <= 2)
        return null;
    res = [];
    for (i = 0; i < l; i++) {
        if (listElements[i].location != location) {
            res.push(listElements[i]);
        } else {
            cond = (value && value.equals(this.colorStops[i].color));
            cond = cond || (!value);
            if (cond) {
                elem = listElements[i];
                break;
            } else {
                res.push(listElements[i]);
            }
        }
    }
    for (k = i + 1; k < l; k++) {
        listElements[k]["htmlBlock"].attr("position", listElements[k].location);
        listElements[k]["htmlBlock"].attr("imarker", k - 1);
        res.push(listElements[k]);
    }
    this.colorStops = res;
    return elem;
}

addAGrad.prototype.showAllColorStops = function() {
    var i, c = this.colorStops,
        l = c.length - 1;
    $(".add-gradient__stop-markers").html("");
    for (i = l; i >= 0; i--) {
        c[i].htmlBlock = eventDraggableMini(".add-gradient__stop-markers", c[i].htmlBlock);
        (c[i].htmlBlock).appendTo($(".add-gradient__stop-markers"));
    }
}

addAGrad.prototype.updateMarks = function(colorLists) {
    var color, block, i, l = colorLists.length;
    for (i = 0; i < l; i++) {
        color = colorLists[i].color.displayColor("rgba");
        block = colorStops[i].htmlBlock;
        block.attr("color", color);
        block.trinity.attr("color", color);
        block.trinity.css("background-color", color);
    }
}

addAGrad.prototype.updateGradient = function() {
    //console.log("_updateGradient");
    var i, text = "",
        c = this.colorStops,
        l = c.length,
        f = this.format;
    text += _displayColorStop(c[0].color, c[0].location, f);
    for (i = 1; i < l; i++) {
        text += ", " + _displayColorStop(c[i].color, c[i].location, f);
    }
    $(".gradient-real-mini").css("background-image", "linear-gradient(to right," + text + ")");
    text = this.type + "-gradient(" + text + ")";

    if (this.repeat) {
        text = "repeating-" + text;
    }
    $(".add-gradient__preview").css("background-image", text);
    text = "background-image: " + text + ";";
    $(".add-gradient__input").val(text);
}

function _refreshLocationMini(activeElement, newLocation) {
    var oldLocation, oldColor, element = {};
    oldLocation = activeElement.attr("position");
    oldColor = parseColor(activeElement.attr("color"));
    element["location"] = newLocation;
    element["color"] = oldColor;
    if (newLocation > parseFloat(oldLocation)) {
        console.log(">");
        newgrad.addStopMarker(newgrad.colorStops, element, true);
    } else {
        newgrad.addStopMarker(newgrad.colorStops, element, false);
    }
    newgrad.removeStopMarker(newgrad.colorStops, oldLocation, oldColor);
    newgrad.showAllColorStops();
    console.log(newgrad);
}

function _createStopMarkerMini(i, marker, width) {
    var stopMarker, colorAux, div;
    div = $("<div></div>");
    colorAux = marker.color.clone();
    stopMarker = $("<div class='color-knob-mini'></div>");
    stopMarker.append(div);
    div.css("background-color", colorAux.displayColor("rgba"));
    stopMarker.attr("title", "Color stop");
    stopMarker.attr("color", colorAux.displayColor("rgba"));
    stopMarker.addClass("stop-marker");
    stopMarker.attr("position", marker.location);
    stopMarker.attr("imarker", i);
    stopMarker.css("left", ((marker.location * width) / 100.0) + "px");
    stopMarker.trinity = div;
    return stopMarker;
}

function eventDraggableMini(containmentClass, element) {
    element.draggable({
        axis: "x",
        containment: containmentClass,
        start: function(event, ui) {
            draggedMarker = newgrad.getStopMarker(parseInt(ui.helper.attr("position")), false); //1
            _getActiveElementMini().removeClass("selected");
            $(this).addClass("selected");
        },
        drag: function(event) {
            draggedMarker = _dragAndDropMini(this, draggedMarker);
            newgrad.updateGradient();
        },
        stop: function(event) {
            draggedMarker = _dragAndDropMini(this, draggedMarker);
            draggedMarker = null;
            newgrad.showAllColorStops();
            newgrad.updateGradient();
        }
    });
    element.css("position", "");
    return element;
}

function _getActiveElementMini() {
    var element;
    element = $(".add-gradient__stop-markers .selected");
    console.log(element.length);
    if (element.length === 0) {
        element = $($(".add-gradient__stop-markers .stop-marker")[0]);
        element.addClass("selected");
    }
    return element;
}

function _dragAndDropMini(drag, dragMarker) {
    var newLocation = Math.round((drag.offsetLeft / newgrad.widthDefault) * 100),
        oldLocation = dragMarker.location,
        element;
    if (oldLocation == newLocation) {
        return dragMarker;
    } else if (newLocation >= 100) {
        newLocation = 100;
        dragMarker.htmlBlock.css("left", drag.widthDefault + "px");
    }
    element = {};
    element["location"] = newLocation;
    element["htmlBlock"] = dragMarker.htmlBlock.clone();
    element["htmlBlock"].attr("position", newLocation);
    element["color"] = dragMarker.color.clone();
    if (newLocation > oldLocation) {
        newgrad.addStopMarker(newgrad.colorStops, element, true);
    } else {
        newgrad.addStopMarker(newgrad.colorStops, element, false);
    }
    newgrad.removeStopMarker(newgrad.colorStops, oldLocation, dragMarker.color);
    $("#add-gradient__color-location").val(newLocation);
    return element;
}

function updateInfoMini(color) {
    console.log(color);
    var colorRgba, activeElement = _getActiveElementMini(),
        location = parseFloat(activeElement.attr("position")),
        mark = newgrad.getStopMarker(location, true);
    if (mark) {
        colorRgba = color.displayColor("rgba");
        console.log(colorRgba);
        //color.changeFormatColor(mark.color.format); //-------------------<<<<----------------
        console.log(color);
        mark.color = color;
        mark.htmlBlock.attr("color", colorRgba);
        activeElement.children().css("background-color", colorRgba);
        newgrad.updateGradient();
    }
}

function _selectAMarkMini() {
    var element = _getActiveElementMini(),
        location = element.attr("position");
    console.log(location);
    $("#add-gradient__color-location").val(location);
}

var newgrad = new addAGrad();
newgrad.showAllColorStops();
newgrad.updateGradient();
_selectAMarkMini();

$(".add-gradient__repeat").click(function() {
    if (repeat) {
        newgrad.repeat = false;
        $(this).removeClass("active");
    } else {
        newgrad.repeat = true;
        $(this).addClass("active");
    }
    updateGradient();
});

$("#mini-show").click(function() {
    console.log(newgrad);
});

$("#add-gradient__color-location").spinner({
    min: 0,
    max: 100,
    spin: function(e, ui) {
        _refreshLocationMini(_getActiveElementMini(), ui.value);
        newgrad.updateGradient();
    },
});

$("#mini-type-selectmenu").selectmenu({
    change: function() {
        newgrad.type = $(this).val();
        newgrad.updateGradient();
    }
});


$("#add-gradient__color-value-button").spectrum({
    color: "rgb(255, 37, 0)",
    preferredFormat: "rgb",
    showAlpha: true,
    showInput: true,
    showPalette: true,
    palette: [
        ["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)", "transparent"],
    ],
    change: function(color) {
        var rgb = color.toRgbString();
        console.log(rgb);
        var pc = parseColor(rgb);
        updateInfoMini(pc);
    },
    move: function(color) {
        var rgb = color.toRgbString();
        console.log(rgb);
        var pc = parseColor(rgb);
        updateInfoMini(pc);
    },
    show: function() {
        var elem = _getActiveElementMini(),
            left = elem.offset().left - 285,
            top = elem.offset().top + 52,
            container = $("#add-gradient__color-value-button").spectrum("container");
        container.css("top", top + "px");
        container.css("left", left + "px");
        gradient.saveHSLStops();
    },
});

$(".add-gradient__stop-markers").on("click", function(e) {
    if (addAMarkMini) {
        var position = _calculatePosition(e.clientX - (this.offsetParent.offsetLeft + this.offsetLeft), newgrad.widthDefault);
        var colorString = $("#add-gradient__color-value-button").spectrum("get").toRgbString();
        console.log(colorString);
        if (colorString) {
            var color = parseColor(colorString);
            console.log(color);
        }
        newgrad.addStopMarker(newgrad.colorStops, { "color": color, "location": position });
        newgrad.showAllColorStops();
        newgrad.updateGradient();
        _selectAMarkMini();
    }
    addAMarkMini = true;
});

$(".add-gradient__stop-markers").on("click", ".color-knob-mini", function(e) {
    addAMarkMini = false;
    var color = $(this).attr("color");
    var activeElement = _getActiveElementMini();
    activeElement.removeClass("selected");
    $(this).addClass("selected");
    _selectAMarkMini();
    console.log(color);
    $("#add-gradient__color-value-button").spectrum("set", color);
    $("#add-gradient__color-value-button").spectrum("toggle");
    return false;
});

$("#add-gradient__delete").on("click", function(e) {
    var activeElement = $(".add-gradient__stop-markers .selected");
    if (activeElement.length === 0) {
        return false;
    }
    var location = parseInt(activeElement.attr("position"));
    var oldColor = parseColor(activeElement.attr("color"));
    //oldColor.changeFormatColor(gradient.format);
    if (location || location == 0) {
        if (newgrad.removeStopMarker(newgrad.colorStops, location, oldColor)) {
            activeElement.remove();
            newgrad.showAllColorStops();
        }
    }
    newgrad.updateGradient();
    var activeLocation = parseFloat(_getActiveElementMini().attr("position"));
    var activeColor = _getActiveElementMini().attr("color");
    $("#add-gradient__color-value-button").spectrum("set", activeColor);
    $("#add-gradient__color-location").val(activeLocation);
    return false;
});