var surface = require('isosurface').surfaceNets
var vec3 = require('gl-vec3')
var mat4 = require('gl-mat4')

var length = vec3.length, sub = vec3.subtract, scale = vec3.scale
var max = vec3.max, min = vec3.min, dot = vec3.dot
var abs = elwise(Math.abs), sqrt = elwise(Math.sqrt)

function elwise (f) {
  return function (out, v) {
    out[0] = f(v[0])
    out[1] = f(v[1])
    out[2] = f(v[2])
    return out
  }
}

module.exports = function (opts) {
  if (!opts) opts = {}
  var v1 = [0,0,0], v2 = [0,0,0]
  var p = [0,0,0]
  var z3 = [0,0,0]
  var b = [3,0.5,3]
  var upper = [0,10,0]
  var lower = [0,-10,0]
  var up = vec3.normalize([],[1,1,1])
  var coneposUp = [0,6.5,0]
  var coneposLow = [0,-6.5,0]
  var coneclip = [-3,-1.8]
  var cyh = [2,9]

  var caps = []
  for (var i = 0; i < 24; i++) {
    var theta = i / 24 * Math.PI*2
    var x = 2.3 * Math.cos(theta)
    var z = 2.3 * Math.sin(theta)
    caps.push([ [x,-7.7,z], [x,7.7,z] ])
  }
  return surface([64,64,64], shape, [[-3.2,-11,-3.2],[3.2,11,3.2]])
}

function shape (x,y,z) {
  p[0] = x, p[1] = y, p[2] = z
  var cymax = cylinder(v1, p, cyh)
  for (var i = 0; i < caps.length; i++) {
    var c = caps[i]
    var x = -capsf(v1, v2, c[0], c[1], .5)
    if (x > cymax) cymax = x
  }
  return Math.min(
    rbox(v1, sub(v1,p,upper), b, 0.01),
    rbox(v1, sub(v1,p,lower), b, 0.01),
    ccone(v1, sub(v2,coneposUp,p), up, coneclip),
    ccone(v1, sub(v2,p,coneposLow), up, coneclip),
    cymax
  )
}

function ccone (tmp, p, c, clip) {
  if (p[1] < clip[0] || p[1] > clip[1]) return 100
  tmp[0] = p[0], tmp[1] = p[2], tmp[2] = 0
  tmp[0] = length(tmp)
  tmp[1] = p[1]
  tmp[2] = 0
  return dot(c,tmp)
}

function capsf (tmp1, tmp2, a, b, r) {
  sub(tmp1, p, a)
  sub(tmp2, b, a)
  var h = clamp(dot(tmp1,tmp2)/dot(tmp2,tmp2), 0.0, 1.0)
  return length(sub(tmp1,tmp1,scale(tmp2,tmp2,h))) - r
}

function clamp (x, lo, hi) {
  return Math.min(Math.max(x, lo), hi)
}

function cylinder (tmp, p, h) {
  tmp[0] = p[0], tmp[1] = p[2], tmp[2] = 0
  var dx = Math.abs(length(tmp)) - h[0]
  var dy = Math.abs(p[1]) - h[1]
  tmp[0] = dx, tmp[1] = dy, tmp[2] = 0
  return Math.min(Math.max(dx,dy),0)
    + length(max(tmp, tmp, z3))
}

function rbox (tmp, p, b, r) {
  return length(max(tmp,sub(tmp,abs(tmp,p),b),z3))-r;
}
