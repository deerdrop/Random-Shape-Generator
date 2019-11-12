var c = document.createElement("canvas"); //the canvas
c.height = 1012;
c.width = 1800;
var ctx = c.getContext("2d"); //the context
var render = document.createElement("img"); //the png render of the canvas
render.setAttribute("width", "100%");
render.setAttribute("src", c.toDataURL("image/png"));
render.setAttribute("style", "border: 2px solid #cccccc;");

var draw_width = c.width * 0.8;
var wide_margin = c.width * 0.1;
var draw_height = c.height * 0.8;
var high_margin = c.height * 0.1;

//parameters
var complexity = 12; //the number of points used to draw the shape, between 5 and 24
var sharpness = 0.55; //affects the chances of a straight line vs curves
var debug = false;
const MIN_COMPLEXITY = 5;
const MAX_COMPLEXITY = 24;

//stores the points for this shape
var points = [];
var duplepoints = [];

$(document).ready(function() {
  $("#render").append(render);
  $("#complexity").change(function() {
    complexity = document.getElementById("complexity").value;
  });
  $("#sharpness").change(function() {
    sharpness = document.getElementById("sharpness").value / 100;
  });
  var enabledebug;
  $("#debugtext").hover(function() {
    enabledebug = setTimeout(function() {
      $("#debug").removeAttr("disabled");
    }, 500);
  }, function() {
    clearTimeout(enabledebug);
    $("#debug").attr("disabled", true);
  });
  $("#debug").change(function() {
    debug = !debug;
    if (debug) {
      drawPoints();
      render.setAttribute("src", c.toDataURL("image/png"));
      document.getElementById("debugtext").innerHTML = "debug on";
    } else {
      document.getElementById("debugtext").innerHTML = "debug off";
    }
  })
  document.getElementById("GenerateShape").onclick = function() {drawShape()};
});

class Point {
  calcTheta() {
    this._theta = Math.atan((c.height/2-this._y) / (this._x-c.width/2)); //the angle of the point relative to the center of the canvas
    if (this._x < c.width/2) {
      this._theta += Math.PI;
    }
  }
  constructor(xval, yval) {
    this._x = xval;
    this._y = yval;
    this.calcTheta();
  }

  get x() {
    return this._x;
  }
  set x(xval) {
    this._x = xval;
    this.calcTheta();
  }
  get y() {
    return this._y;
  }
  set y(yval) {
    this._y = yval;
    this.calcTheta();
  }
  get theta() {
    return this._theta;
  }

  clone() {
    return new Point(this._x, this._y);
  }
  distanceTo(p) {
    return
  }
}

//randomly determies which type of line to draw next based on sharpness parameter
function nextCurve() {
  var rand = Math.random();
  if (rand < sharpness**2) {
    return "straight";
  }
  if (rand < -1*(sharpness**2)+2*sharpness) {
    return "quadratic";
  }
  return "bezier";
}

//generate number of points equal to complexity
function createPoints() {
  points = [];
  if (complexity < MIN_COMPLEXITY) complexity = MIN_COMPLEXITY;
  if (complexity > MAX_COMPLEXITY) complexity = MAX_COMPLEXITY;
  for(var i=0; i<complexity; i++) {
    var p = new Point(Math.random()*draw_width+wide_margin, Math.random()*draw_height+high_margin);
    points.push(p);
  }
  duplepoints = points.slice(0);
}

//draws the points on the canvas (for debugging)
function drawPoints() {
  for(var i=0; i<duplepoints.length; i++) {
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.arc(duplepoints[i].x, duplepoints[i].y, 4, 0, 2*Math.PI);
    switch (i) {
      case 0:
        ctx.strokeStyle = "yellow";
        break;
      case 1:
        ctx.strokeStyle = "green";
        break;
      case 2:
        ctx.strokeStyle = "blue";
        break;
      case 3:
        ctx.strokeStyle = "purple";
        break;
      default:
        ctx.strokeStyle = "red";
    }
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.moveTo(c.width/2 + 8, c.height/2);
  ctx.lineTo(c.width/2 - 8, c.height/2);
  ctx.moveTo(c.width/2, c.height/2 + 8);
  ctx.lineTo(c.width/2, c.height/2 - 8);
  ctx.stroke();
}

//finally draws the shape according to the parameters
function drawShape() {
  if (debug) {
    console.log("##NEW SHAPE##");
    console.log("complexity " + complexity);
    console.log("sharpness " + sharpness);
  }
  ctx.clearRect(0, 0, c.width, c.height);
  createPoints();
  points.sort(function(a,b) {return a.theta - b.theta}); //sorts the points counter-clockwise around the canvas
  //rotates the array to choose a random point as the starting point
  var split = Math.floor(Math.random()*(complexity-1));
  duplepoints = points.slice(split).concat(points.slice(0, split));
  points = duplepoints.slice(0);

  ctx.lineWidth = 10;
  ctx.strokeStyle = "black";
  ctx.beginPath();

  if (sharpness == 1) { //quickly draws a shape made out of only straight lines when settings call for it
    ctx.moveTo(points[0].x, points[0].y);
    for (var i=1; i<points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[0].x, points[0].y);
    ctx.stroke();
    if (debug) {
      drawPoints();
    }
    render.setAttribute("src", c.toDataURL("image/png"));
    return;
  }

  if (sharpness == 0) { //effeciently draws a shape using only bezier curves when settings call for it. sometimes, one quadratic curve is neededs
    var start = points.shift();
    var inter1 = points.shift();
    var inter2 = points.shift();
    var next = points.shift();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(inter1.x, inter1.y, inter2.x, inter2.y, next.x, next.y);
    var prev = inter2;
    var current = next;
    while (points.length > 1) {
      var inter1 = bezierPoint(current, prev);
      var inter2 = points.shift();
      next = points.shift();
      ctx.bezierCurveTo(inter1.x, inter1.y, inter2.x, inter2.y, next.x, next.y);
      prev = inter2;
      current = next;
    }
    if (points.length == 1) {
      inter1 = bezierPoint(current, prev);
      next = points.shift();
      ctx.quadraticCurveTo(inter1.x, inter1.y, next.x, next.y);
      prev = inter1;
      current = next;
    }
    inter1 = bezierPoint(current, prev);
    inter2 = bezierPoint(duplepoints[0], duplepoints[1]);
    next = duplepoints[0];
    ctx.bezierCurveTo(inter1.x, inter1.y, inter2.x, inter2.y, next.x, next.y);
    ctx.stroke();
    points = duplepoints.slice(0);
    if (debug) {
      drawPoints();
    }
    render.setAttribute("src", c.toDataURL("image/png"));
    return;
  }

  var start = points.shift();
  var prev = start;
  var current = start;
  var next;
  ctx.moveTo(start.x, start.y);
  while (points.length > 1) {
    next = points.shift();
    var lineType = nextCurve();
    switch (lineType) {
      case "straight":
        if (debug) console.log("straight");
        ctx.lineTo(next.x, next.y);
        prev = current;
        current = next;
        break;
      case "quadratic":
        if (current != prev && Math.random() > sharpness) { //determines whether to make the curve smoothly transition from previous line based on sharpness; cannot happen for very first line
          if (debug) console.log("quadratic smooth");
          var inter = bezierPoint(current, prev);
        } else {
          if (debug) console.log("quadratic new");
          var inter = next;
          next = points.shift();
        }
        ctx.quadraticCurveTo(inter.x, inter.y, next.x, next.y);
        prev = inter;
        current = next;
        break;
      case "bezier":
        if (debug) console.log("bezier");
        if (current != prev) { //always use a smoothing point, except for the very first line which can't have one
          var inter1 = bezierPoint(current, prev);
          var inter2 = next;
          next = points.shift();
        } else {
          var inter1 = next;
          var inter2 = points.shift();
          next = points.shift();
        }
        ctx.bezierCurveTo(inter1.x, inter1.y, inter2.x, inter2.y, next.x, next.y);
        prev = inter2;
        current = next;
        break;
      default:
        throw "Unexpected line type: " + lineType;
    }
  }
  if (points.length == 1) {
    if (debug) console.log("last point");
    next = points.shift();
    var lineType = nextCurve();
    switch (lineType) {
      case "straight":
        if (debug) console.log("straight");
        ctx.lineTo(next.x, next.y);
        prev = current;
        current = next;
        break;
      case "quadratic":
        if (Math.random() > sharpness) { //determines whether to make the curve smoothly transition from previous line based on sharpness
          if (debug) console.log("quadratic smooth");
          var inter = bezierPoint(current, prev);
        } else {
          if (debug) console.log("final quadratic");
          ctx.quadraticCurveTo(next.x, next.y, start.x, start.y);
          ctx.stroke();
          points = duplepoints.slice(0);
          if (debug) {
            drawPoints();
          }
          render.setAttribute("src", c.toDataURL("image/png"));
          return;
        }
        ctx.quadraticCurveTo(inter.x, inter.y, next.x, next.y);
        prev = inter;
        current = next;
        break;
      case "bezier": //to properly end on a bezier curve with one point remaining, we must first insert a quadratic curve, then the bezier
        if (debug) console.log("quadratic and final bezier");
        var inter1 = bezierPoint(current, prev);
        ctx.quadraticCurveTo(inter1.x, inter1.y, next.x, next.y);
        prev = inter1;
        current = next;
        inter1 = bezierPoint(current, prev);
        var inter2 = bezierPoint(duplepoints[0], duplepoints[1]);
        next = duplepoints[0];
        ctx.bezierCurveTo(inter1.x, inter1.y, inter2.x, inter2.y, next.x, next.y);
        ctx.stroke();
        points = duplepoints.slice(0);
        if (debug) {
          drawPoints();
        }
        render.setAttribute("src", c.toDataURL("image/png"));
        return;
      default:
        throw "Unexpected line type: " + lineType;
    }
  }
  switch (lineType) {
    case "straight":
      if (debug) console.log("final straight");
      ctx.lineTo(start.x, start.y);
      break;
    case "quadratic":
      if (debug) console.log("final quadratic smooth");
      var inter = bezierPoint(current, prev);
      ctx.quadraticCurveTo(inter.x, inter.y, start.x, start.y);
      break;
    case "bezier":
      if (debug) console.log("final bezier");
      var inter1 = bezierPoint(current, prev);
      var inter2 = bezierPoint(duplepoints[0], duplepoints[1]);
      ctx.bezierCurveTo(inter1.x, inter1.y, inter2.x, inter2.y, start.x, start.y);
      break;
  }

  ctx.stroke();
  points = duplepoints.slice(0);
  if (debug) {
    drawPoints();
  }
  render.setAttribute("src", c.toDataURL("image/png"));
}

//finds a point to create a smooth curve continuing from a straight line
function bezierPoint(currentPoint, previousPoint) {
  var x = currentPoint.x - previousPoint.x; //duplicate vector from prev point to current point
  var y = currentPoint.y - previousPoint.y;
  var z = Math.sqrt(x**2 + y**2); //calculate magnitude of vector
  var scalar = (Math.random() + 0.5) * 100; //bezier point will be between 50 and 100 units away from current point
  x *= scalar/z; //set magnitude to between 50 and 100
  y *= scalar/z;
  x += currentPoint.x; //add vector to current point to get new point
  y += currentPoint.y;
  return new Point(x, y);
}
