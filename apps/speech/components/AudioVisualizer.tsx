/// <reference types="@webgpu/types" />
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from 'react-native-wgpu';
import type { CanvasRef, RNCanvasContext } from 'react-native-wgpu';
import tgpu from 'typegpu';

interface AudioVisualizerProps {
  audioData: Float32Array | null;
  isRecording: boolean;
}

const SHADER_SOURCE = `
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
  };

  @group(0) @binding(0) var<storage, read> audioData: array<f32>;

  @vertex
  fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let rawX = f32(vertexIndex) / 511.0; 
    let x = (rawX * 2.0) - 1.0; 
    
    // Read audioData or output default flat line
    let sample = audioData[min(vertexIndex, 511u)];
    
    // Smooth transition for y calculation
    let y = sample * 3.0; 
    
    var output: VertexOutput;
    // We use a fixed depth and slightly adjusted perspective to keep it stable
    output.position = vec4f(x, y, 0.0, 1.0);
    output.color = vec4f(15.0/255.0, 24.0/255.0, 110.0/255.0, 1.0); // Dark Blue (#0f186e)
    return output;
  }

  @fragment
  fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    return input.color;
  }
`;

export const AudioVisualizer: React.FC<AudioVisualizerProps> = React.memo(
  ({ audioData, isRecording }) => {
    const canvasRef = useRef<CanvasRef>(null);
    const deviceRef = useRef<GPUDevice | null>(null);
    const bufferRef = useRef<GPUBuffer | null>(null);

    // Pre-calculate Hanning window coefficients to improve FPS
    const hanningWindow = useRef<Float32Array | null>(null);

    // Persistence state for smoothing
    const lastState = useRef<Float32Array>(new Float32Array(512));
    const smoothingFactor = 0.5; // Increased transparency of changes for better visual stability

    useEffect(() => {
      const N = 512;
      const window = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
      }
      hanningWindow.current = window;
    }, []);

    useEffect(() => {
      if (!isRecording && deviceRef.current && bufferRef.current) {
        // Clear last state
        lastState.current.fill(0);

        // Reset the GPU buffer to a flat line when not recording
        const flatLine = new Float32Array(512);
        deviceRef.current.queue.writeBuffer(
          bufferRef.current,
          0,
          flatLine.buffer,
          flatLine.byteOffset,
          flatLine.byteLength
        );
      }
    }, [isRecording]);

    useEffect(() => {
      let animationFrameId: number;
      let isRunning = true;

      const init = async () => {
        if (!canvasRef.current) return;
        const context = canvasRef.current.getContext(
          'webgpu'
        ) as RNCanvasContext;
        if (!context) return;

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return;

        const device = await adapter.requestDevice();
        deviceRef.current = device;

        // Use typegpu to wrap device semantics structurally
        tgpu.initFromDevice({ device });

        context.configure({
          device,
          format: navigator.gpu.getPreferredCanvasFormat(),
          alphaMode: 'premultiplied',
        });

        const pipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: {
            module: device.createShaderModule({ code: SHADER_SOURCE }),
            entryPoint: 'vertexMain',
          },
          fragment: {
            module: device.createShaderModule({ code: SHADER_SOURCE }),
            entryPoint: 'fragmentMain',
            targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
          },
          primitive: { topology: 'line-strip' }, // Corrected typographical error
        });

        // Create uniform buffer for audio
        const audioBuffer = device.createBuffer({
          size: 512 * 4, // 512 floats
          // eslint-disable-next-line no-bitwise
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        bufferRef.current = audioBuffer;

        const bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: { buffer: audioBuffer },
            },
          ],
        });

        const render = () => {
          if (!isRunning) return;

          if (context && deviceRef.current) {
            const commandEncoder = deviceRef.current.createCommandEncoder();
            const textureView = context.getCurrentTexture().createView();

            const renderPass = commandEncoder.beginRenderPass({
              colorAttachments: [
                {
                  view: textureView,
                  clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, // White background
                  loadOp: 'clear',
                  storeOp: 'store',
                },
              ],
            });

            renderPass.setPipeline(pipeline);
            renderPass.setBindGroup(0, bindGroup);
            renderPass.draw(512);
            renderPass.end();

            deviceRef.current.queue.submit([commandEncoder.finish()]);
            context.present(); // Required by react-native-wgpu
          }
          animationFrameId = requestAnimationFrame(render);
        };

        render();
      };

      // Need a slight timeout in some RN setups to ensure the canvas is fully mounted for getContext
      setTimeout(() => {
        init();
      }, 100);

      return () => {
        isRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }, []);

    useEffect(() => {
      if (
        audioData &&
        isRecording &&
        deviceRef.current &&
        bufferRef.current &&
        hanningWindow.current
      ) {
        // 1. Process data
        const bufferLen = 512;
        const processedData = new Float32Array(bufferLen);
        const window = hanningWindow.current;
        const last = lastState.current;

        // If audioData is shorter than 512, it will be padded with 0s (default for new Float32Array)
        // If it's longer, we take the first 512
        const N = Math.min(audioData.length, bufferLen);

        let sumSq = 0;
        for (let i = 0; i < N; i++) {
          const val = audioData[i] * window[i];
          processedData[i] =
            (1 - smoothingFactor) * val + smoothingFactor * last[i];
          last[i] = processedData[i];
          sumSq += processedData[i] * processedData[i];
        }

        // Update the rest of the buffer with smoothed decay if audioData was short
        for (let i = N; i < bufferLen; i++) {
          processedData[i] = last[i] * smoothingFactor;
          last[i] = processedData[i];
        }

        const rms = Math.sqrt(sumSq / Math.max(N, 1));
        const dynamicBoost = 1.0 + rms * 5.0; // Increased boost for better visibility

        for (let i = 0; i < bufferLen; i++) {
          processedData[i] *= dynamicBoost;
        }

        deviceRef.current.queue.writeBuffer(
          bufferRef.current,
          0,
          processedData.buffer,
          processedData.byteOffset,
          processedData.byteLength
        );
      }
    }, [audioData, isRecording]);

    return (
      <View style={styles.container}>
        <Canvas style={styles.canvas} ref={canvasRef} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    flex: 1,
    width: '100%',
  },
});
