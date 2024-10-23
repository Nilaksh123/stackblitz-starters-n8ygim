server.js:

  const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
public/index.html:

  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Name - Design Portfolio</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Your Name</h1>
        <nav>
            <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#portfolio">Portfolio</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="webgpu-demo">
            <canvas id="webgpu-canvas"></canvas>
        </section>

        <section id="about">
            <h2>About Me</h2>
            <p>Your introduction goes here.</p>
        </section>

        <section id="portfolio">
            <h2>My Work</h2>
            <!-- Add your portfolio items here -->
        </section>

        <section id="contact">
            <h2>Contact Me</h2>
            <p>Your contact information goes here.</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2023 Your Name. All rights reserved.</p>
    </footer>

    <script src="webgpu-demo.js"></script>
</body>
</html>
public/styles.css:

  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
}

header {
    background: #333;
    color: #fff;
    padding: 1rem;
}

header h1 {
    margin: 0;
}

nav ul {
    padding: 0;
}

nav ul li {
    display: inline;
    margin-right: 10px;
}

nav ul li a {
    color: #fff;
    text-decoration: none;
}

main {
    padding: 2rem;
}

#webgpu-demo {
    width: 100%;
    height: 300px;
    margin-bottom: 2rem;
}

#webgpu-canvas {
    width: 100%;
    height: 100%;
}

footer {
    background: #333;
    color: #fff;
    text-align: center;
    padding: 1rem;
    position: fixed;
    bottom: 0;
    width: 100%;
}
public/webgpu-demo.js:

  async function initWebGPU() {
    if (!navigator.gpu) {
        console.log("WebGPU not supported on this browser.");
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.log("Failed to get GPU adapter.");
        return;
    }

    const device = await adapter.requestDevice();
    const canvas = document.getElementById("webgpu-canvas");
    const context = canvas.getContext("webgpu");

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: format,
    });

    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: `
                    struct VertexOutput {
                        @builtin(position) position : vec4<f32>,
                        @location(0) color : vec4<f32>,
                    }

                    @vertex
                    fn main(@location(0) position : vec4<f32>,
                            @location(1) color : vec4<f32>) -> VertexOutput {
                        var output : VertexOutput;
                        output.position = position;
                        output.color = color;
                        return output;
                    }
                `
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: 32,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: "float32x3"
                        },
                        {
                            shaderLocation: 1,
                            offset: 16,
                            format: "float32x4"
                        }
                    ]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({
                code: `
                    @fragment
                    fn main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
                        return color;
                    }
                `
            }),
            entryPoint: "main",
            targets: [
                {
                    format: format
                }
            ]
        },
        primitive: {
            topology: "triangle-list"
        }
    });

    const vertices = new Float32Array([
        -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
        0.0, 0.5, 0.0, 0.0, 0.0, 1.0, 1.0
    ]);

    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    function frame() {
        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store"
                }
            ]
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setVertexBuffer(0, vertexBuffer);
        passEncoder.draw(3, 1, 0, 0);
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

initWebGPU();// run `node index.js` in the terminal

console.log(`Hello Node.js v${process.versions.node}!`);
