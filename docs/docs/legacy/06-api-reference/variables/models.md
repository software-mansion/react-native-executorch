# Variable: models

> `const` **models**: `object`

Defined in: [constants/modelRegistry.ts:474](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelRegistry.ts#L474)

Typed model registry grouped by capability. Each entry is a function-only
accessor: call it (optionally with `{ quant, backend }`) to get the resolved
config. The `backend` parameter is typed to exactly the backends a given
model ships with — asking for a backend a model doesn't publish is a
compile-time error.

## Type Declaration

### classification

> `readonly` **classification**: `object`

#### classification.efficientnet_v2_s

> `readonly` **efficientnet_v2_s**: `Accessor`\<\{ `modelName`: `"efficientnet-v2-s"`; `modelSource`: `string`; \} \| \{ `modelName`: `"efficientnet-v2-s-quantized"`; `modelSource`: `string`; \} \| \{ `modelName`: `"efficientnet-v2-s"`; `modelSource`: `string`; \} \| \{ `modelName`: `"efficientnet-v2-s-quantized"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

### image_embedding

> `readonly` **image_embedding**: `object`

#### image_embedding.clip_vit_base_patch32_image

> `readonly` **clip_vit_base_patch32_image**: `Accessor`\<\{ `modelName`: `"clip-vit-base-patch32-image"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.9.0/xnnpack/clip_vit_base_patch32_image_xnnpack_fp32.pte"`; \} \| \{ `modelName`: `"clip-vit-base-patch32-image-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.9.0/xnnpack/clip_vit_base_patch32_image_xnnpack_int8.pte"`; \}, `"xnnpack"`\>

### image_generation

> `readonly` **image_generation**: `object`

#### image_generation.bk_sdm_tiny_vpred_256

> `readonly` **bk_sdm_tiny_vpred_256**: `Accessor`\<\{ `decoderSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/xnnpack/bk_sdm_tiny_vae_256_xnnpack_fp32.pte"`; `encoderSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/xnnpack/bk_sdm_tiny_text_encoder_xnnpack_fp32.pte"`; `modelName`: `"bk-sdm-tiny-vpred-256"`; `schedulerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/scheduler/scheduler_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/tokenizer/tokenizer.json"`; `unetSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/xnnpack/bk_sdm_tiny_unet_256_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### image_generation.bk_sdm_tiny_vpred_512

> `readonly` **bk_sdm_tiny_vpred_512**: `Accessor`\<\{ `decoderSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/xnnpack/bk_sdm_tiny_vae_xnnpack_fp32.pte"`; `encoderSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/xnnpack/bk_sdm_tiny_text_encoder_xnnpack_fp32.pte"`; `modelName`: `"bk-sdm-tiny-vpred-512"`; `schedulerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/scheduler/scheduler_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/tokenizer/tokenizer.json"`; `unetSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.9.0/xnnpack/bk_sdm_tiny_unet_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

### instance_segmentation

> `readonly` **instance_segmentation**: `object`

#### instance_segmentation.fastsam_s

> `readonly` **fastsam_s**: `Accessor`\<\{ `modelName`: `"fastsam-s"`; `modelSource`: `string`; \} \| \{ `modelName`: `"fastsam-s"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### instance_segmentation.fastsam_x

> `readonly` **fastsam_x**: `Accessor`\<\{ `modelName`: `"fastsam-x"`; `modelSource`: `string`; \} \| \{ `modelName`: `"fastsam-x"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### instance_segmentation.rf_detr_nano

> `readonly` **rf_detr_nano**: `Accessor`\<\{ `modelName`: `"rfdetr-nano-seg"`; `modelSource`: `string`; \} \| \{ `modelName`: `"rfdetr-nano-seg"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### instance_segmentation.yolo26l

> `readonly` **yolo26l**: `Accessor`\<\{ `modelName`: `"yolo26l-seg"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26-seg/resolve/v0.9.0/l/xnnpack/yolo26_seg_l_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### instance_segmentation.yolo26m

> `readonly` **yolo26m**: `Accessor`\<\{ `modelName`: `"yolo26m-seg"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26-seg/resolve/v0.9.0/m/xnnpack/yolo26_seg_m_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### instance_segmentation.yolo26n

> `readonly` **yolo26n**: `Accessor`\<\{ `modelName`: `"yolo26n-seg"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26-seg/resolve/v0.9.0/n/xnnpack/yolo26_seg_n_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### instance_segmentation.yolo26s

> `readonly` **yolo26s**: `Accessor`\<\{ `modelName`: `"yolo26s-seg"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26-seg/resolve/v0.9.0/s/xnnpack/yolo26_seg_s_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### instance_segmentation.yolo26x

> `readonly` **yolo26x**: `Accessor`\<\{ `modelName`: `"yolo26x-seg"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26-seg/resolve/v0.9.0/x/xnnpack/yolo26_seg_x_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

### llm

> `readonly` **llm**: `object`

#### llm.bielik_v3_0_1_5b

> `readonly` **bielik_v3_0_1_5b**: `Accessor`\<\{ `modelName`: `"bielik-v3.0-1.5b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bielik-v3.0/resolve/v0.9.0/xnnpack/bielik_v3_0_1_5b_xnnpack_fp16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bielik-v3.0/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bielik-v3.0/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"bielik-v3.0-1.5b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bielik-v3.0/resolve/v0.9.0/xnnpack/bielik_v3_0_1_5b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bielik-v3.0/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-bielik-v3.0/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.hammer2_1_0_5b

> `readonly` **hammer2_1_0_5b**: `Accessor`\<\{ `modelName`: `"hammer2.1-0.5b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/0_5b/xnnpack/hammer_2_1_0_5b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"hammer2.1-0.5b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/0_5b/xnnpack/hammer_2_1_0_5b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.hammer2_1_1_5b

> `readonly` **hammer2_1_1_5b**: `Accessor`\<\{ `modelName`: `"hammer2.1-1.5b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/1_5b/xnnpack/hammer_2_1_1_5b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"hammer2.1-1.5b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/1_5b/xnnpack/hammer_2_1_1_5b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.hammer2_1_3b

> `readonly` **hammer2_1_3b**: `Accessor`\<\{ `modelName`: `"hammer2.1-3b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/3b/xnnpack/hammer_2_1_3b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"hammer2.1-3b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/3b/xnnpack/hammer_2_1_3b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.lfm2_5_1_2b_instruct

> `readonly` **lfm2_5_1_2b_instruct**: `Accessor`\<\{ `modelName`: `"lfm2.5-1.2b-instruct"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/1_2b/xnnpack/lfm_2_5_1_2b_xnnpack_fp16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/1_2b/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/1_2b/tokenizer.json"`; \} \| \{ `modelName`: `"lfm2.5-1.2b-instruct-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/1_2b/xnnpack/lfm_2_5_1_2b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/1_2b/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/1_2b/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.lfm2_5_350m

> `readonly` **lfm2_5_350m**: `Accessor`\<\{ `modelName`: `"lfm2.5-350m"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/350m/xnnpack/lfm_2_5_350m_xnnpack_fp16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/350m/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/350m/tokenizer.json"`; \} \| \{ `modelName`: `"lfm2.5-350m-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/350m/xnnpack/lfm_2_5_350m_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/350m/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/350m/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.lfm2_5_vl_1_6b

> `readonly` **lfm2_5_vl_1_6b**: `Accessor`\<\{ `capabilities`: readonly \[`"vision"`\]; `generationConfig`: \{ `minP`: `0.15`; `repetitionPenalty`: `1.05`; `temperature`: `0.1`; \}; `modelName`: `"lfm2.5-vl-1.6b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/vl_1_6b/xnnpack/lfm_2_5_vl_1_6b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/vl_1_6b/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/vl_1_6b/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.lfm2_5_vl_450m

> `readonly` **lfm2_5_vl_450m**: `Accessor`\<\{ `capabilities`: readonly \[`"vision"`\]; `generationConfig`: \{ `minP`: `0.15`; `repetitionPenalty`: `1.05`; `temperature`: `0.1`; \}; `modelName`: `"lfm2.5-vl-450m-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/vl_450m/xnnpack/lfm_2_5_vl_450m_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/vl_450m/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/resolve/v0.9.0/vl_450m/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.llama3_2_1b

> `readonly` **llama3_2_1b**: `Accessor`\<\{ `modelName`: `"llama-3.2-1b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/1b/xnnpack/llama_3_2_1b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"llama-3.2-1b-spinquant"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/1b/xnnpack/llama_3_2_1b_xnnpack_spinquant.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.llama3_2_3b

> `readonly` **llama3_2_3b**: `Accessor`\<\{ `modelName`: `"llama-3.2-3b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/3b/xnnpack/llama_3_2_3b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"llama-3.2-3b-spinquant"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/3b/xnnpack/llama_3_2_3b_xnnpack_spinquant.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.phi_4_mini_4b

> `readonly` **phi_4_mini_4b**: `Accessor`\<\{ `modelName`: `"phi-4-mini-4b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.9.0/xnnpack/phi_4_mini_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"phi-4-mini-4b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.9.0/xnnpack/phi_4_mini_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen2_5_0_5b

> `readonly` **qwen2_5_0_5b**: `Accessor`\<\{ `modelName`: `"qwen2.5-0.5b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/0_5b/xnnpack/qwen_2_5_0_5b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"qwen2.5-0.5b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/0_5b/xnnpack/qwen_2_5_0_5b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen2_5_1_5b

> `readonly` **qwen2_5_1_5b**: `Accessor`\<\{ `modelName`: `"qwen2.5-1.5b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/1_5b/xnnpack/qwen_2_5_1_5b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"qwen2.5-1.5b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/1_5b/xnnpack/qwen_2_5_1_5b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen2_5_3b

> `readonly` **qwen2_5_3b**: `Accessor`\<\{ `modelName`: `"qwen2.5-3b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/3b/xnnpack/qwen_2_5_3b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"qwen2.5-3b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/3b/xnnpack/qwen_2_5_3b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen3_0_6b

> `readonly` **qwen3_0_6b**: `Accessor`\<\{ `generationConfig`: \{ `temperature`: `0.6`; `topP`: `0.95`; \}; `modelName`: `"qwen3-0.6b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/0_6b/xnnpack/qwen_3_0_6b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `generationConfig`: \{ `temperature`: `0.6`; `topP`: `0.95`; \}; `modelName`: `"qwen3-0.6b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/0_6b/xnnpack/qwen_3_0_6b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen3_1_7b

> `readonly` **qwen3_1_7b**: `Accessor`\<\{ `generationConfig`: \{ `temperature`: `0.6`; `topP`: `0.95`; \}; `modelName`: `"qwen3-1.7b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/1_7b/xnnpack/qwen_3_1_7b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `generationConfig`: \{ `temperature`: `0.6`; `topP`: `0.95`; \}; `modelName`: `"qwen3-1.7b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/1_7b/xnnpack/qwen_3_1_7b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen3_4b

> `readonly` **qwen3_4b**: `Accessor`\<\{ `generationConfig`: \{ `temperature`: `0.6`; `topP`: `0.95`; \}; `modelName`: `"qwen3-4b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/4b/xnnpack/qwen_3_4b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `generationConfig`: \{ `temperature`: `0.6`; `topP`: `0.95`; \}; `modelName`: `"qwen3-4b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/4b/xnnpack/qwen_3_4b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen3_5_0_8b

> `readonly` **qwen3_5_0_8b**: `Accessor`\<\{ `modelName`: `"qwen3.5-0.8b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3.5/resolve/v0.9.0/0_8b/xnnpack/qwen_3_5_0_8b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3.5/resolve/v0.9.0/0_8b/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3.5/resolve/v0.9.0/0_8b/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.qwen3_5_2b

> `readonly` **qwen3_5_2b**: `Accessor`\<\{ `modelName`: `"qwen3.5-2b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3.5/resolve/v0.9.0/2b/xnnpack/qwen_3_5_2b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3.5/resolve/v0.9.0/2b/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-qwen-3.5/resolve/v0.9.0/2b/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.smollm2_1_1_7b

> `readonly` **smollm2_1_1_7b**: `Accessor`\<\{ `modelName`: `"smollm2.1-1.7b"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/1_7b/xnnpack/smollm2_1_7b_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"smollm2.1-1.7b-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/1_7b/xnnpack/smollm2_1_7b_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.smollm2_1_135m

> `readonly` **smollm2_1_135m**: `Accessor`\<\{ `modelName`: `"smollm2.1-135m"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/135m/xnnpack/smollm2_135m_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"smollm2.1-135m-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/135m/xnnpack/smollm2_135m_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### llm.smollm2_1_360m

> `readonly` **smollm2_1_360m**: `Accessor`\<\{ `modelName`: `"smollm2.1-360m"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/360m/xnnpack/smollm2_360m_xnnpack_bf16.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer.json"`; \} \| \{ `modelName`: `"smollm2.1-360m-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/360m/xnnpack/smollm2_360m_xnnpack_8da4w.pte"`; `tokenizerConfigSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer_config.json"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

### object_detection

> `readonly` **object_detection**: `object`

#### object_detection.rf_detr_nano

> `readonly` **rf_detr_nano**: `Accessor`\<\{ `modelName`: `"rf-detr-nano"`; `modelSource`: `string`; \} \| \{ `modelName`: `"rf-detr-nano"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### object_detection.ssdlite_320_mobilenet_v3_large

> `readonly` **ssdlite_320_mobilenet_v3_large**: `Accessor`\<\{ `modelName`: `"ssdlite-320-mobilenet-v3-large"`; `modelSource`: `string`; \} \| \{ `modelName`: `"ssdlite-320-mobilenet-v3-large"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### object_detection.yolo26l

> `readonly` **yolo26l**: `Accessor`\<\{ `modelName`: `"yolo26l"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26/resolve/v0.9.0/l/xnnpack/yolo26_l_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### object_detection.yolo26m

> `readonly` **yolo26m**: `Accessor`\<\{ `modelName`: `"yolo26m"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26/resolve/v0.9.0/m/xnnpack/yolo26_m_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### object_detection.yolo26n

> `readonly` **yolo26n**: `Accessor`\<\{ `modelName`: `"yolo26n"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26/resolve/v0.9.0/n/xnnpack/yolo26_n_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### object_detection.yolo26s

> `readonly` **yolo26s**: `Accessor`\<\{ `modelName`: `"yolo26s"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26/resolve/v0.9.0/s/xnnpack/yolo26_s_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

#### object_detection.yolo26x

> `readonly` **yolo26x**: `Accessor`\<\{ `modelName`: `"yolo26x"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26/resolve/v0.9.0/x/xnnpack/yolo26_x_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

### ocr

> `readonly` **ocr**: `object`

#### ocr.craft()

> **craft**: (`__namedParameters`) => `object`

##### Parameters

###### \_\_namedParameters

###### language

`"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

##### Returns

`object`

###### detectorSource

> **detectorSource**: `string` = `DETECTOR_CRAFT_MODEL`

###### language

> **language**: `"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

###### modelName

> **modelName**: `"ocr-abq"` \| `"ocr-ady"` \| `"ocr-af"` \| `"ocr-ava"` \| `"ocr-az"` \| `"ocr-be"` \| `"ocr-bg"` \| `"ocr-bs"` \| `"ocr-chSim"` \| `"ocr-che"` \| `"ocr-cs"` \| `"ocr-cy"` \| `"ocr-da"` \| `"ocr-dar"` \| `"ocr-de"` \| `"ocr-en"` \| `"ocr-es"` \| `"ocr-et"` \| `"ocr-fr"` \| `"ocr-ga"` \| `"ocr-hr"` \| `"ocr-hu"` \| `"ocr-id"` \| `"ocr-inh"` \| `"ocr-ic"` \| `"ocr-it"` \| `"ocr-ja"` \| `"ocr-kbd"` \| `"ocr-kn"` \| `"ocr-ko"` \| `"ocr-ku"` \| `"ocr-la"` \| `"ocr-lbe"` \| `"ocr-lez"` \| `"ocr-lt"` \| `"ocr-lv"` \| `"ocr-mi"` \| `"ocr-mn"` \| `"ocr-ms"` \| `"ocr-mt"` \| `"ocr-nl"` \| `"ocr-no"` \| `"ocr-oc"` \| `"ocr-pi"` \| `"ocr-pl"` \| `"ocr-pt"` \| `"ocr-ro"` \| `"ocr-ru"` \| `"ocr-rsCyrillic"` \| `"ocr-rsLatin"` \| `"ocr-sk"` \| `"ocr-sl"` \| `"ocr-sq"` \| `"ocr-sv"` \| `"ocr-sw"` \| `"ocr-tab"` \| `"ocr-te"` \| `"ocr-tjk"` \| `"ocr-tl"` \| `"ocr-tr"` \| `"ocr-uk"` \| `"ocr-uz"` \| `"ocr-vi"`

###### recognizerSource

> **recognizerSource**: `string`

### pose_estimation

> `readonly` **pose_estimation**: `object`

#### pose_estimation.yolo26n

> `readonly` **yolo26n**: `Accessor`\<\{ `modelName`: `"yolo26n-pose"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-yolo26-pose/resolve/v0.9.0/xnnpack/yolo26_pose_n_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

### privacy_filter

> `readonly` **privacy_filter**: `object`

#### privacy_filter.nemotron

> `readonly` **nemotron**: `Accessor`\<\{ `labelNames`: readonly \[`"O"`, `"B-account_number"`, `"I-account_number"`, `"E-account_number"`, `"S-account_number"`, `"B-age"`, `"I-age"`, `"E-age"`, `"S-age"`, `"B-api_key"`, `"I-api_key"`, `"E-api_key"`, `"S-api_key"`, `"B-bank_routing_number"`, `"I-bank_routing_number"`, `"E-bank_routing_number"`, `"S-bank_routing_number"`, `"B-biometric_identifier"`, `"I-biometric_identifier"`, `"E-biometric_identifier"`, `"S-biometric_identifier"`, `"B-blood_type"`, `"I-blood_type"`, `"E-blood_type"`, `"S-blood_type"`, `"B-certificate_license_number"`, `"I-certificate_license_number"`, `"E-certificate_license_number"`, `"S-certificate_license_number"`, `"B-city"`, `"I-city"`, `"E-city"`, `"S-city"`, `"B-company_name"`, `"I-company_name"`, `"E-company_name"`, `"S-company_name"`, `"B-coordinate"`, `"I-coordinate"`, `"E-coordinate"`, `"S-coordinate"`, `"B-country"`, `"I-country"`, `"E-country"`, `"S-country"`, `"B-county"`, `"I-county"`, `"E-county"`, `"S-county"`, `"B-credit_debit_card"`, `"I-credit_debit_card"`, `"E-credit_debit_card"`, `"S-credit_debit_card"`, `"B-customer_id"`, `"I-customer_id"`, `"E-customer_id"`, `"S-customer_id"`, `"B-cvv"`, `"I-cvv"`, `"E-cvv"`, `"S-cvv"`, `"B-date"`, `"I-date"`, `"E-date"`, `"S-date"`, `"B-date_of_birth"`, `"I-date_of_birth"`, `"E-date_of_birth"`, `"S-date_of_birth"`, `"B-date_time"`, `"I-date_time"`, `"E-date_time"`, `"S-date_time"`, `"B-device_identifier"`, `"I-device_identifier"`, `"E-device_identifier"`, `"S-device_identifier"`, `"B-education_level"`, `"I-education_level"`, `"E-education_level"`, `"S-education_level"`, `"B-email"`, `"I-email"`, `"E-email"`, `"S-email"`, `"B-employee_id"`, `"I-employee_id"`, `"E-employee_id"`, `"S-employee_id"`, `"B-employment_status"`, `"I-employment_status"`, `"E-employment_status"`, `"S-employment_status"`, `"B-fax_number"`, `"I-fax_number"`, `"E-fax_number"`, `"S-fax_number"`, `"B-first_name"`, `"I-first_name"`, `"E-first_name"`, `"S-first_name"`, `"B-gender"`, `"I-gender"`, `"E-gender"`, `"S-gender"`, `"B-health_plan_beneficiary_number"`, `"I-health_plan_beneficiary_number"`, `"E-health_plan_beneficiary_number"`, `"S-health_plan_beneficiary_number"`, `"B-http_cookie"`, `"I-http_cookie"`, `"E-http_cookie"`, `"S-http_cookie"`, `"B-ipv4"`, `"I-ipv4"`, `"E-ipv4"`, `"S-ipv4"`, `"B-ipv6"`, `"I-ipv6"`, `"E-ipv6"`, `"S-ipv6"`, `"B-language"`, `"I-language"`, `"E-language"`, `"S-language"`, `"B-last_name"`, `"I-last_name"`, `"E-last_name"`, `"S-last_name"`, `"B-license_plate"`, `"I-license_plate"`, `"E-license_plate"`, `"S-license_plate"`, `"B-mac_address"`, `"I-mac_address"`, `"E-mac_address"`, `"S-mac_address"`, `"B-medical_record_number"`, `"I-medical_record_number"`, `"E-medical_record_number"`, `"S-medical_record_number"`, `"B-national_id"`, `"I-national_id"`, `"E-national_id"`, `"S-national_id"`, `"B-occupation"`, `"I-occupation"`, `"E-occupation"`, `"S-occupation"`, `"B-password"`, `"I-password"`, `"E-password"`, `"S-password"`, `"B-phone_number"`, `"I-phone_number"`, `"E-phone_number"`, `"S-phone_number"`, `"B-pin"`, `"I-pin"`, `"E-pin"`, `"S-pin"`, `"B-political_view"`, `"I-political_view"`, `"E-political_view"`, `"S-political_view"`, `"B-postcode"`, `"I-postcode"`, `"E-postcode"`, `"S-postcode"`, `"B-race_ethnicity"`, `"I-race_ethnicity"`, `"E-race_ethnicity"`, `"S-race_ethnicity"`, `"B-religious_belief"`, `"I-religious_belief"`, `"E-religious_belief"`, `"S-religious_belief"`, `"B-sexuality"`, `"I-sexuality"`, `"E-sexuality"`, `"S-sexuality"`, `"B-ssn"`, `"I-ssn"`, `"E-ssn"`, `"S-ssn"`, `"B-state"`, `"I-state"`, `"E-state"`, `"S-state"`, `"B-street_address"`, `"I-street_address"`, `"E-street_address"`, `"S-street_address"`, `"B-swift_bic"`, `"I-swift_bic"`, `"E-swift_bic"`, `"S-swift_bic"`, `"B-tax_id"`, `"I-tax_id"`, `"E-tax_id"`, `"S-tax_id"`, `"B-time"`, `"I-time"`, `"E-time"`, `"S-time"`, `"B-unique_id"`, `"I-unique_id"`, `"E-unique_id"`, `"S-unique_id"`, `"B-url"`, `"I-url"`, `"E-url"`, `"S-url"`, `"B-user_name"`, `"I-user_name"`, `"E-user_name"`, `"S-user_name"`, `"B-vehicle_identifier"`, `"I-vehicle_identifier"`, `"E-vehicle_identifier"`, `"S-vehicle_identifier"`\]; `modelName`: `"privacy-filter-nemotron"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-nemotron/resolve/v0.9.0/xnnpack/privacy_filter_nemotron_xnnpack_8da4w.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-nemotron/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### privacy_filter.openai

> `readonly` **openai**: `Accessor`\<\{ `labelNames`: readonly \[`"O"`, `"B-account_number"`, `"I-account_number"`, `"E-account_number"`, `"S-account_number"`, `"B-private_address"`, `"I-private_address"`, `"E-private_address"`, `"S-private_address"`, `"B-private_date"`, `"I-private_date"`, `"E-private_date"`, `"S-private_date"`, `"B-private_email"`, `"I-private_email"`, `"E-private_email"`, `"S-private_email"`, `"B-private_person"`, `"I-private_person"`, `"E-private_person"`, `"S-private_person"`, `"B-private_phone"`, `"I-private_phone"`, `"E-private_phone"`, `"S-private_phone"`, `"B-private_url"`, `"I-private_url"`, `"E-private_url"`, `"S-private_url"`, `"B-secret"`, `"I-secret"`, `"E-secret"`, `"S-secret"`\]; `modelName`: `"privacy-filter-openai"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-openai/resolve/v0.9.0/xnnpack/privacy_filter_openai_xnnpack_8da4w.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-openai/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

### semantic_segmentation

> `readonly` **semantic_segmentation**: `object`

#### semantic_segmentation.deeplab_v3_mobilenet_v3_large

> `readonly` **deeplab_v3_mobilenet_v3_large**: `Accessor`\<\{ `modelName`: `"deeplab-v3-mobilenet-v3-large"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.9.0/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_fp32.pte"`; \} \| \{ `modelName`: `"deeplab-v3-mobilenet-v3-large-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.9.0/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_int8.pte"`; \}, `"xnnpack"`\>

#### semantic_segmentation.deeplab_v3_resnet101

> `readonly` **deeplab_v3_resnet101**: `Accessor`\<\{ `modelName`: `"deeplab-v3-resnet101"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.9.0/xnnpack/deeplab_v3_resnet101_xnnpack_fp32.pte"`; \} \| \{ `modelName`: `"deeplab-v3-resnet101-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.9.0/xnnpack/deeplab_v3_resnet101_xnnpack_int8.pte"`; \}, `"xnnpack"`\>

#### semantic_segmentation.deeplab_v3_resnet50

> `readonly` **deeplab_v3_resnet50**: `Accessor`\<\{ `modelName`: `"deeplab-v3-resnet50"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.9.0/xnnpack/deeplab_v3_resnet50_xnnpack_fp32.pte"`; \} \| \{ `modelName`: `"deeplab-v3-resnet50-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.9.0/xnnpack/deeplab_v3_resnet50_xnnpack_int8.pte"`; \}, `"xnnpack"`\>

#### semantic_segmentation.fcn_resnet101

> `readonly` **fcn_resnet101**: `Accessor`\<\{ `modelName`: `"fcn-resnet101"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-fcn/resolve/v0.9.0/xnnpack/fcn_resnet101_xnnpack_fp32.pte"`; \} \| \{ `modelName`: `"fcn-resnet101-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-fcn/resolve/v0.9.0/xnnpack/fcn_resnet101_xnnpack_int8.pte"`; \}, `"xnnpack"`\>

#### semantic_segmentation.fcn_resnet50

> `readonly` **fcn_resnet50**: `Accessor`\<\{ `modelName`: `"fcn-resnet50"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-fcn/resolve/v0.9.0/xnnpack/fcn_resnet50_xnnpack_fp32.pte"`; \} \| \{ `modelName`: `"fcn-resnet50-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-fcn/resolve/v0.9.0/xnnpack/fcn_resnet50_xnnpack_int8.pte"`; \}, `"xnnpack"`\>

#### semantic_segmentation.lraspp_mobilenet_v3_large

> `readonly` **lraspp_mobilenet_v3_large**: `Accessor`\<\{ `modelName`: `"lraspp-mobilenet-v3-large"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lraspp/resolve/v0.9.0/xnnpack/lraspp_mobilenet_v3_large_xnnpack_fp32.pte"`; \} \| \{ `modelName`: `"lraspp-mobilenet-v3-large-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-lraspp/resolve/v0.9.0/xnnpack/lraspp_mobilenet_v3_large_xnnpack_int8.pte"`; \}, `"xnnpack"`\>

#### semantic_segmentation.selfie_segmentation

> `readonly` **selfie_segmentation**: `Accessor`\<\{ `modelName`: `"selfie-segmentation"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-selfie-segmentation/resolve/v0.9.0/xnnpack/selfie_segmentation_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

### speech_to_text

> `readonly` **speech_to_text**: `object`

#### speech_to_text.whisper_base

> `readonly` **whisper_base**: `Accessor`\<\{ `isMultilingual`: `true`; `modelName`: `"whisper-base"`; `modelSource`: `string`; `tokenizerSource`: `string`; \} \| \{ `isMultilingual`: `true`; `modelName`: `"whisper-base"`; `modelSource`: `string`; `tokenizerSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### speech_to_text.whisper_base_en

> `readonly` **whisper_base_en**: `Accessor`\<\{ `isMultilingual`: `false`; `modelName`: `"whisper-base-en"`; `modelSource`: `string`; `tokenizerSource`: `string`; \} \| \{ `isMultilingual`: `false`; `modelName`: `"whisper-base-en"`; `modelSource`: `string`; `tokenizerSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### speech_to_text.whisper_small

> `readonly` **whisper_small**: `Accessor`\<\{ `isMultilingual`: `true`; `modelName`: `"whisper-small"`; `modelSource`: `string`; `tokenizerSource`: `string`; \} \| \{ `isMultilingual`: `true`; `modelName`: `"whisper-small"`; `modelSource`: `string`; `tokenizerSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### speech_to_text.whisper_small_en

> `readonly` **whisper_small_en**: `Accessor`\<\{ `isMultilingual`: `false`; `modelName`: `"whisper-small-en"`; `modelSource`: `string`; `tokenizerSource`: `string`; \} \| \{ `isMultilingual`: `false`; `modelName`: `"whisper-small-en"`; `modelSource`: `string`; `tokenizerSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### speech_to_text.whisper_tiny

> `readonly` **whisper_tiny**: `Accessor`\<\{ `isMultilingual`: `true`; `modelName`: `"whisper-tiny"`; `modelSource`: `string`; `tokenizerSource`: `string`; \} \| \{ `isMultilingual`: `true`; `modelName`: `"whisper-tiny"`; `modelSource`: `string`; `tokenizerSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### speech_to_text.whisper_tiny_en

> `readonly` **whisper_tiny_en**: `Accessor`\<\{ `isMultilingual`: `false`; `modelName`: `"whisper-tiny-en"`; `modelSource`: `string`; `tokenizerSource`: `string`; \} \| \{ `isMultilingual`: `false`; `modelName`: `"whisper-tiny-en"`; `modelSource`: `string`; `tokenizerSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

### style_transfer

> `readonly` **style_transfer**: `object`

#### style_transfer.candy

> `readonly` **candy**: `Accessor`\<\{ `modelName`: `"style-transfer-candy"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-candy-quantized"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-candy"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-candy-quantized"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### style_transfer.mosaic

> `readonly` **mosaic**: `Accessor`\<\{ `modelName`: `"style-transfer-mosaic"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-mosaic-quantized"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-mosaic"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-mosaic-quantized"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### style_transfer.rain_princess

> `readonly` **rain_princess**: `Accessor`\<\{ `modelName`: `"style-transfer-rain-princess"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-rain-princess-quantized"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-rain-princess"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-rain-princess-quantized"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

#### style_transfer.udnie

> `readonly` **udnie**: `Accessor`\<\{ `modelName`: `"style-transfer-udnie"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-udnie-quantized"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-udnie"`; `modelSource`: `string`; \} \| \{ `modelName`: `"style-transfer-udnie-quantized"`; `modelSource`: `string`; \}, `"xnnpack"` \| `"coreml"`\>

### text_embedding

> `readonly` **text_embedding**: `object`

#### text_embedding.all_minilm_l6_v2

> `readonly` **all_minilm_l6_v2**: `Accessor`\<\{ `modelName`: `"all-minilm-l6-v2"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.9.0/xnnpack/all_minilm_l6_v2_xnnpack_fp32.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### text_embedding.all_mpnet_base_v2

> `readonly` **all_mpnet_base_v2**: `Accessor`\<\{ `modelName`: `"all-mpnet-base-v2"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-all-mpnet-base-v2/resolve/v0.9.0/xnnpack/all_mpnet_base_v2_xnnpack_fp32.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-all-mpnet-base-v2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### text_embedding.clip_vit_base_patch32_text

> `readonly` **clip_vit_base_patch32_text**: `Accessor`\<\{ `modelName`: `"clip-vit-base-patch32-text"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.9.0/xnnpack/clip_vit_base_patch32_text_xnnpack_fp32.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### text_embedding.distiluse_base_multilingual_cased_v2

> `readonly` **distiluse_base_multilingual_cased_v2**: `Accessor`\<\{ `modelName`: `"distiluse-base-multilingual-cased-v2-8da4w"`; `modelSource`: `string`; `tokenizerSource`: `string`; \}, `"xnnpack"`\>

#### text_embedding.multi_qa_minilm_l6_cos_v1

> `readonly` **multi_qa_minilm_l6_cos_v1**: `Accessor`\<\{ `modelName`: `"multi-qa-minilm-l6-cos-v1"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-multi-qa-MiniLM-L6-cos-v1/resolve/v0.9.0/xnnpack/multi_qa_minilm_l6_cos_v1_xnnpack_fp32.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-multi-qa-MiniLM-L6-cos-v1/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### text_embedding.multi_qa_mpnet_base_dot_v1

> `readonly` **multi_qa_mpnet_base_dot_v1**: `Accessor`\<\{ `modelName`: `"multi-qa-mpnet-base-dot-v1"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-multi-qa-mpnet-base-dot-v1/resolve/v0.9.0/xnnpack/multi_qa_mpnet_base_dot_v1_xnnpack_fp32.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-multi-qa-mpnet-base-dot-v1/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

#### text_embedding.paraphrase_multilingual_minilm_l12_v2

> `readonly` **paraphrase_multilingual_minilm_l12_v2**: `Accessor`\<\{ `modelName`: `"paraphrase-multilingual-minilm-l12-v2-quantized"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-paraphrase-multilingual-MiniLM-L12-v2/resolve/v0.9.0/xnnpack/paraphrase_multilingual_minilm_l12_v2_xnnpack_8da4w.pte"`; `tokenizerSource`: `"https://huggingface.co/software-mansion/react-native-executorch-paraphrase-multilingual-MiniLM-L12-v2/resolve/v0.9.0/tokenizer.json"`; \}, `"xnnpack"`\>

### text_to_speech

> `readonly` **text_to_speech**: `object`

#### text_to_speech.kokoro

> `readonly` **kokoro**: `object`

#### text_to_speech.kokoro.de

> `readonly` **de**: `object`

#### text_to_speech.kokoro.de.anna()

> `readonly` **anna**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_gb

> `readonly` **en_gb**: `object`

#### text_to_speech.kokoro.en_gb.daniel()

> `readonly` **daniel**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_gb.emma()

> `readonly` **emma**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_us

> `readonly` **en_us**: `object`

#### text_to_speech.kokoro.en_us.adam()

> `readonly` **adam**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_us.heart()

> `readonly` **heart**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_us.michael()

> `readonly` **michael**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_us.river()

> `readonly` **river**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_us.santa()

> `readonly` **santa**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.en_us.sarah()

> `readonly` **sarah**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.es

> `readonly` **es**: `object`

#### text_to_speech.kokoro.es.alex()

> `readonly` **alex**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.es.dora()

> `readonly` **dora**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.fr

> `readonly` **fr**: `object`

#### text_to_speech.kokoro.fr.siwis()

> `readonly` **siwis**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.hi

> `readonly` **hi**: `object`

#### text_to_speech.kokoro.hi.alpha()

> `readonly` **alpha**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.hi.omega()

> `readonly` **omega**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.hi.psi()

> `readonly` **psi**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.it

> `readonly` **it**: `object`

#### text_to_speech.kokoro.it.nicola()

> `readonly` **nicola**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.it.sara()

> `readonly` **sara**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.pl

> `readonly` **pl**: `object`

#### text_to_speech.kokoro.pl.mateusz()

> `readonly` **mateusz**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.pt

> `readonly` **pt**: `object`

#### text_to_speech.kokoro.pt.dora()

> `readonly` **dora**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

#### text_to_speech.kokoro.pt.santa()

> `readonly` **santa**: () => [`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

##### Returns

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

### vad

> `readonly` **vad**: `object`

#### vad.fsmn_vad

> `readonly` **fsmn_vad**: `Accessor`\<\{ `modelName`: `"fsmn-vad"`; `modelSource`: `"https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad/resolve/v0.9.0/xnnpack/fsmn_vad_xnnpack_fp32.pte"`; \}, `"xnnpack"`\>

## Example

```ts
import { models } from 'react-native-executorch';

// Platform default (CoreML on iOS, XNNPACK on Android for multi-backend models).
useObjectDetection({ model: models.object_detection.rf_detr_nano() });

// Explicit backend.
useObjectDetection({
  model: models.object_detection.rf_detr_nano({ backend: 'xnnpack' }),
});

// Non-quantized variant.
useLLM({ model: models.llm.llama3_2_3b({ quant: false }) });

// OCR — language-parameterized.
useOcr({ model: models.ocr({ language: 'en' }) });
```
