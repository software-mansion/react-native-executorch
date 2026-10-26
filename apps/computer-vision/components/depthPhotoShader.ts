/** Two image textures: the original photograph and its normalized relative depth. */
export const DEPTH_PHOTO_SHADER = `
uniform shader photo;
uniform shader depth;
uniform float2 origin;
uniform float2 size;
uniform float2 tilt;
uniform float2 focus;
uniform float amount;
uniform float mode;

float depthAt(float2 uv) {
  return depth.eval(origin + clamp(uv, 0.0, 1.0) * size).r;
}

half4 photoAt(float2 uv) {
  return photo.eval(origin + clamp(uv, 0.0, 1.0) * size);
}

half4 main(float2 position) {
  float2 uv = (position - origin) / size;

  if (mode > 2.5) {
    return photoAt(uv);
  }

  if (mode > 1.5) {
    float d = depthAt(uv);
    half3 farColor = half3(0.035, 0.07, 0.22);
    half3 middleColor = half3(0.06, 0.76, 0.80);
    half3 nearColor = half3(1.0, 0.83, 0.40);
    half3 color = mix(farColor, middleColor, smoothstep(0.0, 0.6, d));
    color = mix(color, nearColor, smoothstep(0.5, 1.0, d));
    return half4(color, 1.0);
  }

  if (mode > 0.5) {
    float difference = abs(depthAt(uv) - depthAt(focus));
    float radius = smoothstep(0.02, 0.55, difference) * amount * 18.0;
    half4 color = half4(0.0);
    float totalWeight = 0.0;
    // A weighted spiral avoids the distinct repeated edges of a sparse blur ring.
    for (int i = 0; i < 32; i++) {
      float r = sqrt((float(i) + 0.5) / 32.0);
      float angle = float(i) * 2.399963;
      float weight = exp(-2.0 * r * r);
      float2 offset = float2(cos(angle), sin(angle)) * r * radius / size;
      color += photoAt(uv + offset) * weight;
      totalWeight += weight;
    }
    return color / totalWeight;
  }

  // Slight overscan hides exposed edges. Iterate the inverse depth warp so
  // the depth lookup follows the displaced source pixel rather than the screen.
  float2 base = (uv - 0.5) / (1.0 + amount * 0.10) + 0.5;
  float2 ray = tilt * amount * 0.045;
  float2 displaced = base;
  for (int i = 0; i < 4; i++) {
    displaced = mix(displaced, base + ray * (depthAt(displaced) - 0.35), 0.75);
  }
  return photoAt(displaced);
}
`;
