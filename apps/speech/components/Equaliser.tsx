// @ts-nocheck
import { bubbleSchema } from '../assets/schemas/bubbleSchema';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { Canvas, useDevice, useGPUContext } from 'react-native-wgpu';
import tgpu, {
  Render,
  Sampled,
  TgpuRoot,
  TgpuSampledTexture,
  TgpuTexture,
} from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import { noiseTexture } from '../assets/base64/noiseTexture';

const SMOOTH_CONST = 0.1; // Smoothing time‑constant               (0.01‑0.3)
const ALPHA = 0.016 / (0.016 + SMOOTH_CONST); // Derived blend factor; edit via SMOOTH_CONST

const mainVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: { outPos: d.builtin.position, uv: d.vec2f },
}) /* wgsl */ `{
  var pos = array<vec2f, 6>(vec2(-1.0, 1.0), vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0), 
    vec2(1.0, -1.0),
    vec2(1.0, 1.0));
  var uv = array<vec2f, 6>(
    vec2(0.0, 1.0), 
    vec2(0.0, 0.0),  
    vec2(1.0, 0.0),  
    vec2(0.0, 1.0),
    vec2(1.0, 0.0), 
    vec2(1.0, 1.0)   
  );
  return Out(vec4f(pos[in.vertexIndex], 0.0, 1.0), uv[in.vertexIndex]);
}`;

export default function Equaliser(props: any) {
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const { device = null } = useDevice();
  const { width, height } = Dimensions.get('window');
  const root = useMemo(
    () => (device ? tgpu.initFromDevice({ device }) : null),
    [device]
  );
  const { ref, context } = useGPUContext();

  const time = useMemo(() => root?.createUniform(d.f32) ?? null, [root]);
  const pipelineRef = useRef<GPURenderPipeline | null>(null);
  const w = useMemo(() => root?.createUniform(d.f32) ?? null, [root]);
  const h = useMemo(() => root?.createUniform(d.f32) ?? null, [root]);
  const volume = useMemo(() => root?.createUniform(d.f32) ?? null, [root]);
  const imageSampler = device?.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });
  const [imageTexture, setImageTexture] = useState<
    (TgpuTexture & Sampled & Render) | undefined
  >(undefined);
  const velSmooth = useRef(0.0);

  const smoothFunction = (value: number) => {
    velSmooth.current = velSmooth.current + ALPHA * (value - velSmooth.current);
    return velSmooth.current;
  };

  useEffect(() => {
    if (!root) {
      return;
    }
    async function init(root: TgpuRoot) {
      const response = await fetch(noiseTexture);
      const imageBitmap = await createImageBitmap(await response.blob());
      const [srcWidth, srcHeight] = [imageBitmap.width, imageBitmap.height];

      const image = root['~unstable']
        .createTexture({
          size: [srcWidth, srcHeight],
          format: 'rgba8unorm',
        })
        .$usage('sampled', 'render');

      setImageTexture(image);

      root.device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: root.unwrap(image) },
        [srcWidth, srcHeight]
      );
    }
    init(root);
  }, [root]);

  useEffect(() => {
    if (!root || !device || !context) return;
    if (!imageTexture) return;
    if (
      w === null ||
      h === null ||
      time === null ||
      volume === null ||
      props.equaliserData === null
    )
      return;

    try {
      w.write(width);
      h.write(height);

      context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
      });

      const sampledView = imageTexture.createView(
        'sampled'
      ) as TgpuSampledTexture<'2d', d.F32>;
      const sampler = tgpu['~unstable'].sampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
      });

      const bubble = root.createUniform(bubbleSchema);

      const hash31 = tgpu.fn(
        [d.vec3f],
        d.f32
      )((p) => {
        const k = d.vec3f(17.0, 59.4, 15.0);
        const m = 43758.5453123;
        return std.fract(std.mul(std.cos(std.dot(p, k)), m));
      });

      const fade = tgpu.fn(
        [d.vec3f],
        d.vec3f
      )((t) => std.mul(std.mul(t, t), std.sub(3.0, std.mul(2.0, t))));

      const smoothstep = tgpu.fn(
        [d.f32, d.f32, d.f32],
        d.f32
      )((edge0, edge1, x) => {
        const t = std.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3.0 - 2.0 * t);
      });

      const valueNoise = tgpu.fn(
        [d.vec3f],
        d.f32
      )((p) => {
        const i0 = std.floor(p);
        const f0 = fade(std.fract(p));
        const c000 = hash31(i0);
        const c100 = hash31(std.add(i0, d.vec3f(1.0, 0.0, 0.0)));
        const c010 = hash31(std.add(i0, d.vec3f(0.0, 1.0, 0.0)));
        const c110 = hash31(std.add(i0, d.vec3f(1.0, 1.0, 0.0)));
        const c001 = hash31(std.add(i0, d.vec3f(0.0, 0.0, 1.0)));
        const c101 = hash31(std.add(i0, d.vec3f(1.0, 0.0, 1.0)));
        const c011 = hash31(std.add(i0, d.vec3f(0.0, 1.0, 1.0)));
        const c111 = hash31(std.add(i0, d.vec3f(1.0, 1.0, 1.0)));

        const x00 = std.mix(c000, c100, f0.x);
        const x10 = std.mix(c010, c110, f0.x);
        const x01 = std.mix(c001, c101, f0.x);
        const x11 = std.mix(c011, c111, f0.x);

        const y0 = std.mix(x00, x10, f0.y);
        const y1 = std.mix(x01, x11, f0.y);

        return std.sub(std.mul(std.mix(y0, y1, f0.z), 2.0), 1.0);
      });

      const noise = tgpu.fn(
        [d.vec3f],
        d.f32
      )((x) => {
        let p = std.floor(x);
        let f = fade(std.fract(x));

        let uv = std.add(
          std.add(p.xy, std.mul(d.vec2f(37.0, 239.0), d.vec2f(p.z, p.z))),
          f.xy
        );
        let tex = std.textureSampleLevel(
          sampledView,
          sampler,
          std.fract(std.div(std.add(uv, d.vec2f(0.5, 0.5)), 256.0)),
          0.0
        ).yx;

        return std.mix(tex.x, tex.y, f.z) * 2.0 - 1.0;
      });

      const fbm = tgpu.fn(
        [d.vec3f, d.vec3f, d.f32, d.f32, d.f32, d.u32, d.i32],
        d.f32
      )((p, pos, scl, mlt, fctr, optimisedNoise, iCount) => {
        let q = std.add(p, pos);
        let f = d.f32(0.0);
        let scale = d.f32(scl);
        if (scale < 0.0) scale = 0.0;
        let factor = d.f32(fctr);

        for (let i = 0; i < iCount; i++) {
          if (optimisedNoise === 1) {
            f += noise(q) * scale;
          } else {
            f += valueNoise(q) * scale;
          }
          q = std.mul(q, factor);
          scale *= mlt;
          factor += 0.5;
        }
        return f;
      });

      const sdHollowSphere = tgpu.fn(
        [d.vec3f, d.f32, d.f32, d.f32],
        d.f32
      )((p, er, ir, fbmVal) => {
        let vol = d.f32(volume.$) * bubble.$.volumeMultiplier;
        return (
          std.abs(
            std.length(p) -
              er -
              (vol + 1.0) * bubble.$.sphereNoiseMultiplier * fbmVal
          ) - ir
        );
      });

      const palette = tgpu.fn(
        [d.f32],
        d.vec3f
      )((t) => {
        let a = bubble.$.colorOne;
        let b = bubble.$.colorTwo;
        let c = bubble.$.colorThree;
        let e = bubble.$.colorFour;
        return std.add(
          a,
          std.mul(b, std.cos(std.mul(6.28318, std.add(std.mul(c, t), e))))
        );
      });

      const scene = tgpu.fn(
        [d.vec3f, d.f32],
        d.f32
      )((p, fbmVal) => {
        let sphere = sdHollowSphere(
          p,
          bubble.$.sphereRadius,
          bubble.$.sphereThickness,
          fbmVal
        );
        if (bubble.$.additionalLayerOfDeformations === 1) {
          let vol = d.f32(volume.$) * bubble.$.volumeMultiplier;
          let f = bubble.$.addNoiseMultiplier * fbmVal * (1.0 + vol);
          if (bubble.$.absInFormula === 1) f = std.abs(f);
          if (bubble.$.noiseIsAdded === 1) f = -f;
          return -sphere - f;
        }
        return -sphere;
      });

      const raymarch = tgpu.fn(
        [d.vec3f, d.vec3f],
        d.vec4f
      )((ro, rd) => {
        let res = d.vec4f(0.0, 0.0, 0.0, 0.0);
        let hash = hash31(rd);

        let depth = d.f32(0.0);
        depth = bubble.$.stepLength;
        if (bubble.$.dithering === 1) {
          let hash = hash31(rd);
          depth *= hash;
        }

        let fbmVal = d.f32(0.0);
        let step = bubble.$.stepLength;

        for (let i = 0; depth < bubble.$.metersDepth; i++) {
          let p = std.add(ro, std.mul(rd, depth));
          fbmVal = fbm(
            p,
            d.vec3f(
              bubble.$.shiftVector.x * time.$,
              bubble.$.shiftVector.y * time.$,
              bubble.$.shiftVector.z * time.$
            ),
            bubble.$.scale,
            bubble.$.scaleMultiplier,
            bubble.$.factor,
            bubble.$.optimisedNoise,
            d.i32(bubble.$.numberOfOctaves)
          );
          let density = std.clamp(scene(p, fbmVal), 0.0, 1.0);
          if (bubble.$.varyingStepLength === 1)
            step = std.mix(
              bubble.$.stepLength * 1.5,
              bubble.$.stepLength * 0.5,
              smoothstep(0.0, 0.2, density)
            );
          if (density > 0.0) {
            let pal = palette(bubble.$.colorMultiplier * fbmVal);
            let color = d.vec4f(pal.x, pal.y, pal.z, bubble.$.colorDensity);
            color = d.vec4f(
              color.x * color.w,
              color.y * color.w,
              color.z * color.w,
              color.w
            );
            res = std.add(
              res,
              std.mul(color, bubble.$.lightAbsorbtion - res.w)
            );
          }
          if (res.w > 0.95) {
            break;
          }
          depth += step;
        }
        return res;
      });

      const mainFragment = tgpu['~unstable'].fragmentFn({
        in: { uv: d.vec2f },
        out: d.vec4f,
      })(({ uv }) => {
        {
          let new_uv = std.mul(std.sub(uv, 0.5), 2.0);
          new_uv = d.vec2f(new_uv.x, new_uv.y * (h.$ / w.$));
          let ro = d.vec3f(0.0, 0.0, -2.2);
          let rd = std.normalize(
            d.vec3f(new_uv.x, new_uv.y, 1.0 * bubble.$.angleDistortion)
          );
          let res = raymarch(ro, rd);
          return d.vec4f(res);
        }
      });

      const pipeline = root['~unstable']
        .withVertex(mainVertex, {})
        .withFragment(mainFragment, { format: presentationFormat })
        .createPipeline();

      let startTime = performance.now();
      let frameId: number;

      const render = () => {
        const timestamp = (performance.now() - startTime) / 1000;
        if (timestamp > 500.0) {
          startTime = performance.now();
        }

        volume.write(smoothFunction(props.volume.current));

        time.write(timestamp);

        bubble.write({
          metersDepth: d.f32(
            props.equaliserData.current.renderQualityAndSpeed.metersDepth.value
          ),
          stepLength: d.f32(
            props.equaliserData.current.renderQualityAndSpeed.stepLength.value
          ),
          varyingStepLength: d.u32(
            props.equaliserData.current.renderQualityAndSpeed.varyingStepLength
              .value
          ),
          dithering: d.u32(
            props.equaliserData.current.renderQualityAndSpeed.dithering.value
          ),
          optimisedNoise: d.u32(
            props.equaliserData.current.renderQualityAndSpeed.optimisedNoise
              .value
          ),
          angleDistortion: d.f32(
            props.equaliserData.current.lighting.angleDistortion.value
          ),
          lightAbsorbtion: d.f32(
            props.equaliserData.current.lighting.lightAbsorbtion.value
          ),
          colorOne: d.vec3f(props.equaliserData.current.colors.colorOne.value),
          colorTwo: d.vec3f(props.equaliserData.current.colors.colorTwo.value),
          colorThree: d.vec3f(
            props.equaliserData.current.colors.colorThree.value
          ),
          colorFour: d.vec3f(
            props.equaliserData.current.colors.colorFour.value
          ),
          colorDensity: d.f32(
            props.equaliserData.current.colors.colorDensity.value
          ),
          colorMultiplier: d.f32(
            props.equaliserData.current.colors.colorMultiplier.value
          ),

          scale: d.f32(props.equaliserData.current.noise.scale.value),
          scaleMultiplier: d.f32(
            props.equaliserData.current.noise.scaleMultiplier.value
          ),
          factor: d.f32(props.equaliserData.current.noise.factor.value),
          numberOfOctaves: d.u32(
            props.equaliserData.current.noise.numberOfOctaves.value
          ),
          shiftVector: d.vec3f(
            props.equaliserData.current.noise.shiftVector.value
          ),
          sphereRadius: d.f32(
            props.equaliserData.current.sphere.sphereRadius.value
          ),
          sphereThickness: d.f32(
            props.equaliserData.current.sphere.sphereThickness.value
          ),
          sphereNoiseMultiplier: d.f32(
            props.equaliserData.current.sphere.sphereNoiseMultiplier.value
          ),
          additionalLayerOfDeformations: d.u32(
            props.equaliserData.current.additionalDeformations
              .additionalLayerOfDeformations.value
          ),
          absInFormula: d.u32(
            props.equaliserData.current.additionalDeformations.absInFormula
              .value
          ),
          noiseIsAdded: d.u32(
            props.equaliserData.current.additionalDeformations.noiseIsAdded
              .value
          ),
          addNoiseMultiplier: d.f32(
            props.equaliserData.current.additionalDeformations
              .addNoiseMultiplier.value
          ),
          volumeMultiplier: d.f32(
            props.equaliserData.current.volumeControl.volumeMultiplier.value
          ),
        });

        const view = context.getCurrentTexture().createView();

        pipeline
          .withColorAttachment({
            view,
            clearValue: [0, 0, 0, 0],
            loadOp: 'clear',
            storeOp: 'store',
          })
          .draw(6);

        context.present();
        frameId = requestAnimationFrame(render);
      };
      frameId = requestAnimationFrame(render);
    } catch (error) {
      console.error('Error in Equaliser shader setup:', error);
    }

    return () => {};
  }, [root, device, context, imageTexture, w, h, time, volume]);

  return <Canvas ref={ref} style={{ width: '100%', height: '100%' }} />;
}

//  equaliser component
