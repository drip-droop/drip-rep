
    function curve(ctx, points, tension, numOfSeg, close) {
    "use strict";

    if (typeof points === "undefined" || points.length < 2)
        return new Float32Array(0);

    // options or defaults
    tension = typeof tension === "number" ? tension : 0.5;
    numOfSeg = typeof numOfSeg === "number" ? numOfSeg : 25;

    var pts, // for cloning point array
        i = 1,
        l = points.length,
        rPos = 0,
        rLen = (l - 2) * numOfSeg + 2 + (close ? 2 * numOfSeg : 0),
        res = new Float32Array(rLen),
        cache = new Float32Array((numOfSeg + 2) << 2),
        cachePtr = 4;

    pts = points.slice(0);

    if (close) {
        pts.unshift(points[l - 1]); // insert end point as first point
        pts.unshift(points[l - 2]);
        pts.push(points[0], points[1]); // first point as last point
    } else {
        pts.unshift(points[1]); // copy 1. point and insert at beginning
        pts.unshift(points[0]);
        pts.push(points[l - 2], points[l - 1]); // duplicate end-points
    }

    // cache inner-loop calculations as they are based on t alone
    cache[0] = 1; // 1,0,0,0

    for (; i < numOfSeg; i++) {
        var st = i / numOfSeg,
            st2 = st * st,
            st3 = st2 * st,
            st23 = st3 * 2,
            st32 = st2 * 3;

        cache[cachePtr++] = st23 - st32 + 1; // c1
        cache[cachePtr++] = st32 - st23; // c2
        cache[cachePtr++] = st3 - 2 * st2 + st; // c3
        cache[cachePtr++] = st3 - st2; // c4
    }

    cache[++cachePtr] = 1; // 0,1,0,0

    // calc. points
    parse(pts, cache, l, tension);

    if (close) {
        pts = [];
        pts.push(
            points[l - 4],
            points[l - 3],
            points[l - 2],
            points[l - 1], // second last and last
            points[0],
            points[1],
            points[2],
            points[3]
        ); // first and second
        parse(pts, cache, 4, tension);
    }

    function parse(pts, cache, l, tension) {
        for (var i = 2, t; i < l; i += 2) {
            var pt1 = pts[i],
                pt2 = pts[i + 1],
                pt3 = pts[i + 2],
                pt4 = pts[i + 3],
                t1x = (pt3 - pts[i - 2]) * tension,
                t1y = (pt4 - pts[i - 1]) * tension,
                t2x = (pts[i + 4] - pt1) * tension,
                t2y = (pts[i + 5] - pt2) * tension,
                c = 0,
                c1,
                c2,
                c3,
                c4;

            for (t = 0; t < numOfSeg; t++) {
                c1 = cache[c++];
                c2 = cache[c++];
                c3 = cache[c++];
                c4 = cache[c++];

                res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
                res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
            }
        }
    }

    // add last point
    l = close ? 0 : points.length - 2;
    res[rPos++] = points[l++];
    res[rPos] = points[l];

    // add lines to path
    for (i = 0, l = res.length; i < l; i += 2) ctx.lineTo(res[i], res[i + 1]);

    return res;
}

// -------------- start -----------------

const canvas = document.createElement("canvas");
canvas.className="backdrop";
const c = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

// ----------- parameters ----------------
var phase = 0;
var points = [];
const deg_to_rad_Unit = Math.PI / 180;

const radiusBase = 525;
const radiusRange = 25;
const angleStep = 7.5;
const speed = 7;
const frequency = 2.25;

// -------------------------------------

function loop() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.beginPath();
    c.moveTo(0, 0);

    for (let angle = 0; angle <= 90; angle += angleStep) {
        radius =
            radiusRange *
            Math.sin(frequency * angle + phase * (angle >= 45 ? -0.85 : 1));
        radius += radiusBase;

        points.push(
            radius * Math.cos(angle * deg_to_rad_Unit),
            radius * Math.sin(angle * deg_to_rad_Unit)
        );
    }

    curve(c, points);
    c.lineTo(0, 0);
    c.fill();

    phase += 0.005 * speed;
    points = [];

    requestAnimationFrame(loop);
}

loop();
