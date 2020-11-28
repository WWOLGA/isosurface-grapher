main();

function main() {
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            varying mediump vec4 vColor;

            void main() {
              gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
              vColor = aVertexColor;
            }`;
  
    const fsSource = `
            varying mediump vec4 vColor;

            void main() {
              gl_FragColor = vColor;
            }`;
  
    var shaderProgram = gl.createProgram();

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);
    gl.attachShader(shaderProgram, vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    //this program graphs zero isosurfaces of function, i.e. the surface where f(x,y,z) = 0.
    //for example, to graph a sphere of radius 2, the corresponding function is f = x^2 + y^2 + z^2 - 4

    // sphere
    //function uf(x,y,z) {return x*x+y*y+z*z-3;}

    //function uf(x,y,z) {return x*y-z+z*z;}

    //function uf(x,y,z) {return x*y*z-1;}

    //function uf(x,y,z) {return z-Math.sin(3*x)*Math.cos(3*y);}

    //function uf(x,y,z) {return z-Math.cos(Math.acos(x)/y);}

    // 2d guassian function
    function uf(x,y,z) {return z-Math.exp(-x*x-y*y)}

    var positions = cubeMeshToPointArray(marchingCubes({x:-2, y:-2, z:-2}, 0.5, 8, uf));

    var colors = [];

    for(var i = 0; i < positions.length/3; i++) {
        colors.push(Math.random()*2/3+1/3, Math.random()*2/3+1/3, Math.random()*2/3+1/3, 1);
    }
  
    // for(var i = 0; i < positions.length; i += 3) {
    //     x = positions[i];
    //     y = positions[i+1];
    //     z = positions[i+2];
    //     colors.push((x+4)/6, (y+4)/6, (z+4)/6, 1);
    // }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    var positionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    var colorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
    gl.enableVertexAttribArray(colorAttribute);
    gl.vertexAttribPointer(colorAttribute, 4, gl.FLOAT, false, 0, 0);

    var then = 0;
    var cubeRotation = 0.0;

    function render(now) {
        now *= 0.0002;
        const deltaTime = now - then;
        then = now;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const projectionMatrix = mat4.create();

        // const fieldOfView = 45 * Math.PI / 180;
        // const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        // const zNear = 0.1;
        // const zFar = 100.0;
        // mat4.perspective(projectionMatrix,
        //                 fieldOfView,
        //                 aspect,
        //                 zNear,
        //                 zFar);

        var orthoRenderWidth = 3;
        var orthoRenderHeight = orthoRenderWidth * gl.canvas.clientHeight / gl.canvas.clientWidth;
        var zMax = 100;
        mat4.ortho(projectionMatrix,
                   -orthoRenderWidth, orthoRenderWidth,
                   -orthoRenderHeight, orthoRenderHeight,
                   -zMax, zMax);

        const modelViewMatrix = mat4.create();
        // mat4.translate(modelViewMatrix,     // destination matrix
        //               modelViewMatrix,     // matrix to translate
        //               [-0.0, 0.0, -6.0]);  // amount to translate
        mat4.rotate(modelViewMatrix,  // destination matrix
                    modelViewMatrix,  // matrix to rotate
                    cubeRotation,     // amount to rotate in radians
                    [0, 0, 1]);       // axis to rotate around (Z)
        mat4.rotate(modelViewMatrix,  // destination matrix
                    modelViewMatrix,  // matrix to rotate
                    cubeRotation * .7,// amount to rotate in radians
                    [0, 1, 0]);       // axis to rotate around (X)

        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'), false, projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), false, modelViewMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, positions.length/3);
        cubeRotation += deltaTime;

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}