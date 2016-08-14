# column-mesh

generate a 3d mesh of a greek column

# example

[view this example](https://substack.neocities.org/col/2.html)

``` js
var column = require('column-mesh')
var mesh = column({
  radius: 2,
  height: 10
})

var regl = require('regl')()
var normals = require('angle-normals')
var camera = require('regl-camera')(regl, { center: [25,0,0] })
var mat4 = require('gl-mat4')
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
  regl.clear({ color: [0,0,0,1] })
  camera(() => { draw() })
})
```

# api

``` js
var column = require('column-mesh')
```

## var mesh = column(opts)

Return a `mesh` with vertex `mesh.positions` and `mesh.cells` triangle faces.

* `opts.radius` - default: 2
* `opts.height` - default: 10
* `opts.flutes` - number of carved vertical sections, default: 24
* `opts.fluteRadius` - default: 0.5
* `opts.fluteDistance` - default: 0.6
* `opts.capitalLength` - size of the top block, default: `radius*sqrt(2.3)`
* `opts.capitalHeight` - height of the top block, default: 0.5
* `opts.baseLength` - size of the bottom block, default: `radius*sqrt(2.3)`
* `opts.baseHeight` - height of the bottom block, default: 0.5

# install

```
npm install column-mesh
```

# license

BSD
