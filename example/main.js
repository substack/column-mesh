var surface = require('isosurface').surfaceNets
var vec3 = require('gl-vec3')
var mat4 = require('gl-mat4')

var length = vec3.length, sub = vec3.subtract
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

var v1 = [0,0,0], v2 = [0,0,0]
var p = [0,0,0]
var z3 = [0,0,0]
var b = [3,1,3]
var upper = [0,10,0]
var lower = [0,-10,0]
var up = vec3.normalize([],[1,1,1])
var conepos = [0,6.5,0]
var coneclip = [-3,-1.8]
var mesh = surface([64,64,64], shape, [[-4,-15,-4],[4,15,4]])

function shape (x,y,z) {
  p[0] = x, p[1] = y, p[2] = z
  return Math.min(
    rbox(v1, sub(v1,p,upper), b, 0.01),
    rbox(v1, sub(v1,p,lower), b, 0.01),
    ccone(v1, sub(v2,conepos,p), up, coneclip)
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

function rbox (tmp, p, b, r) {
  return length(max(tmp,sub(tmp,abs(tmp,p),b),z3))-r;
}

var regl = require('regl')()
var normals = require('angle-normals')
var camera = require('regl-camera')(regl, { center: [25,0,0] })
var rmat = []

var draw = regl({
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    void main () {
      gl_FragColor = vec4(abs(vnormal), 1.0);
    }
  `,
  vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 position, normal;
    varying vec3 vnormal;
    void main () {
      vnormal = normal;
      gl_Position = projection * view * model * vec4(position, 1.0);
    }
  `,
  attributes: {
    position: mesh.positions,
    normal: normals(mesh.cells, mesh.positions)
  },
  uniforms: {
    model: (context) => {
      var theta = context.time*0.25
      return mat4.rotateY(rmat, mat4.identity(rmat), theta)
    }
  },
  elements: mesh.cells
})
regl.frame(() => {
  regl.clear({
    color: [0,0,0,1]
  })
  camera(() => { draw() })
})
