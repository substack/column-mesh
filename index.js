var surfaceNets = require('surface-nets')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var vec3 = require('gl-vec3')
var mat4 = require('gl-mat4')
var defined = require('defined')

var length = vec3.length, sub = vec3.subtract, scale = vec3.scale
var multiply = vec3.multiply
var max = vec3.max, min = vec3.min, dot = vec3.dot
var abs = elwise(Math.abs), sqrt = elwise(Math.sqrt)
var z3 = [0,0,0]

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
  var flutes = defined(opts.flutes, 24)
  var radius = defined(opts.radius, 2)
  var fluteRadius = defined(opts.fluteRadius, 0.5)
  var fluteDistance = defined(opts.fluteDistance, radius + fluteRadius * 0.6)
  var capLen = defined(opts.capitalLength, radius * Math.sqrt(2.3))
  var capHeight = defined(opts.capitalHeight, 0.5)
  var baseLen = defined(opts.baseLength, radius * Math.sqrt(2.3))
  var baseHeight = defined(opts.baseHeight, 0.5)
  var height = defined(opts.height, 20) / 2
  var shr = Math.max(radius, capLen, baseLen) * 1.1
  var shh = height + 1

  var v1 = [0,0,0], v2 = [0,0,0], v3 = [0,0,0]
  var p = [0,0,0]
  var bhi = [capLen,capHeight,capLen]
  var blo = [baseLen,baseHeight,baseLen]
  var upper = [0,height,0]
  var lower = [0,-height,0]
  var up = vec3.normalize([],[1,1,1])
  var coneposUp = [0,height-3.5,0]
  var coneposLow = [0,3.5-height,0]
  var coneclip = [-3,-1.8]
  var cyh = [radius,height-1]

  var caps = []
  for (var i = 0; i < flutes; i++) {
    var theta = i / flutes * Math.PI*2
    var x = fluteDistance * Math.cos(theta)
    var z = fluteDistance * Math.sin(theta)
    caps.push([ [x,2.3-height,z], [x,height-2.3,z] ])
  }
  var data = ndarray(new Float64Array(64*64*64),[64,64,64])
  fill(data, function (i,j,k) {
    var x = ((i/63)*2-1)*shr
    var y = ((j/63)*2-1)*(shh+baseHeight+capHeight)
    var z = ((k/63)*2-1)*shr
    return shape(x,y,z)
  })
  return scaler(surfaceNets(data))

  function scaler (mesh) {
    for (var i = 0; i < mesh.positions.length; i++) {
      var m = mesh.positions[i]
      m[0] = (m[0]/63*2-1)*shr
      m[1] = (m[1]/63*2-1)*(shh+baseHeight+capHeight)
      m[2] = (m[2]/63*2-1)*shr
    }
    return mesh
  }

  function shape (x,y,z) {
    p[0] = x, p[1] = y, p[2] = z
    var cymax = cylinder(v1, p, cyh)
    for (var i = 0; i < caps.length; i++) {
      var c = caps[i]
      var x = -capsf(v1, v2, p, c[0], c[1], .5)
      if (x > cymax) cymax = x
    }
    return Math.min(
      rbox(v1, sub(v1,capShift(v1,p),upper), bhi, 0.01),
      rbox(v1, sub(v1,baseShift(v1,p),lower), blo, 0.01),
      ccone(v1, sub(v2,coneposUp,scaleCone(v3,p)), up, coneclip),
      ccone(v1, sub(v2,scaleCone(v3,p),coneposLow), up, coneclip),
      cymax
    )
  }
  function scaleCone (out, p) {
    out[0] = 2/radius
    out[1] = 1
    out[2] = 2/radius
    return multiply(out, p, out)
  }
  function capShift (out, p) {
    out[0] = p[0]
    out[1] = p[1] - (capHeight - 0.5)
    out[2] = p[2]
    return out
  }
  function baseShift (out, p) {
    out[0] = p[0]
    out[1] = p[1] + (baseHeight - 0.5)
    out[2] = p[2]
    return out
  }
}

function ccone (tmp, p, c, clip) {
  if (p[1] < clip[0] || p[1] > clip[1]) return 100
  tmp[0] = p[0], tmp[1] = p[2], tmp[2] = 0
  tmp[0] = length(tmp)
  tmp[1] = p[1]
  tmp[2] = 0
  return dot(c,tmp)
}

function capsf (tmp1, tmp2, p, a, b, r) {
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
