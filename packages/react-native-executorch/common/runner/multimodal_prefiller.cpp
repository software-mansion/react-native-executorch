/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_prefiller.cpp
// with our token-embedding padding fix and LFM2-VL adaptations.

#include "multimodal_prefiller.h"
#include "constants.h"
#include "util.h"
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <rnexecutorch/Log.h>
#include <string>

namespace executorch::extension::llm {

using ::executorch::aten::SizesType;
using ::executorch::runtime::Error;
using ::executorch::runtime::EValue;
using ::executorch::runtime::Result;

MultimodalPrefiller::MultimodalPrefiller(
    Module &module, MultimodalDecoderRunner &decoder_runner,
    tokenizers::HFTokenizer &tokenizer, IEncoder *image_encoder,
    IEncoder *audio_encoder)
    : module_(&module), decoder_runner_(&decoder_runner),
      tokenizer_(&tokenizer), image_encoder_(image_encoder),
      audio_encoder_(audio_encoder) {}

Result<uint64_t>
MultimodalPrefiller::prefill(const std::vector<MultimodalInput> &inputs,
                             int64_t &start_pos) {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "kappa multimodal prefill");

  const bool uses_ple = decoder_runner_->uses_ple();
  const long t_prefill_begin = time_in_ms();

  ET_CHECK_OR_RETURN_ERROR(!inputs.empty(), InvalidArgument,
                           "prefill: empty input list");

  // ------------------------------------------------------------
  // Capacity & shape policy from PTE metadata.
  //
  // Three knobs drive prefill:
  //   * get_max_seq_len     — text_decoder S cap. In dynamic-shape PTEs this
  //                           is the per-call chunk size (Gemma4 iter201 = 128);
  //                           in static-shape PTEs (LFM2-VL) it is also the
  //                           single-shot prefill cap.
  //   * get_max_context_len — total KV budget (Gemma4 iter201 = 2048). Only
  //                           materially used by the dynamic-shape path.
  //   * enable_dynamic_shape — selects between chunked (true) and single-shot
  //                            padded (false) prefill.
  // ------------------------------------------------------------
  int64_t max_seq_len = -1;
  {
    auto r = module_->get(kMaxSeqLen);
    if (r.error() == Error::Ok) {
      max_seq_len = r->toScalar().to<int64_t>();
    }
  }
  if (max_seq_len <= 0) {
    max_seq_len = kMaxPrefillLen;
  }

  int64_t max_context_len = max_seq_len;
  {
    auto r = module_->get(kMaxContextLen);
    if (r.error() == Error::Ok) {
      max_context_len = r->toScalar().to<int64_t>();
    }
  }

  bool enable_dynamic_shape = false;
  {
    auto r = module_->get(kEnableDynamicShape);
    if (r.error() == Error::Ok) {
      enable_dynamic_shape = r->toScalar().to<bool>();
    }
  }

  const int64_t prefill_total_cap =
      enable_dynamic_shape ? max_context_len : max_seq_len;
  const int64_t decoder_chunk_size = max_seq_len;

  // ------------------------------------------------------------
  // Pass 1: build a fused input_ids buffer spanning all inputs.
  //
  // Mirrors gemma_export/experiments/infer_image.py::prefill_single_shot:
  //   llm_ids = prefix_ids + [0] * num_soft + suffix_ids
  // Image positions use pad_token_id=0, matching HF modeling_gemma4.py:2190
  // (placeholder_id is rewritten to 0 before PLE lookup). The decoder embeds
  // at those positions are then overwritten with the vision encoder output
  // in pass 2.
  // ------------------------------------------------------------
  struct ImageSlot {
    const MultimodalInput *input; // non-owning, valid for duration of call
    int64_t slot_start;
    int64_t num_visual;
  };
  // Audio tokens are dynamic per clip, so we encode first and remember a
  // BYTE SNAPSHOT of the encoder output + count + dtype; pass 2 splices
  // from the snapshot.
  //
  // We can NOT stash the EValue here. EValue holds an aten::Tensor which is
  // just a TensorImpl*; `Method::get_output(i)` returns `const EValue&` to
  // Method-internal storage and Module::execute copies that EValue into the
  // returned vector. The copy shares the underlying TensorImpl, so a later
  // execute() on the same method — a second audio input in this prefill,
  // a Vulkan backend output-buffer reuse across methods, or a load-time
  // warm-up — mutates `sizes()` in place under our feet. The original error
  // ("audio encoder returned 96 tokens, expected 60") is exactly this:
  // slot.num_audio was captured from the FIRST encode, slot.encoded.size(1)
  // reflected the SECOND. Mirrors main_mm.cpp:604-675's copy-on-encode.
  struct AudioSlot {
    std::vector<uint8_t> bytes;
    ::executorch::aten::ScalarType dtype;
    int64_t slot_start;
    int64_t num_audio;
    int64_t audio_hidden;
  };

  std::vector<int64_t> ids;
  ids.reserve(static_cast<size_t>(prefill_total_cap));
  std::vector<ImageSlot> image_slots;
  std::vector<AudioSlot> audio_slots;
  long audio_encode_ms = 0;
  int audio_calls = 0;

  for (const auto &input : inputs) {

    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "kappa input type", input.is_audio() ? "audio" : "no audio", input.is_image() ? "image" : "no image");

    if (input.is_image()) {
      ET_CHECK_OR_RETURN_ERROR(image_encoder_ != nullptr, InvalidState,
                               "No image encoder registered");
      const int32_t num_visual = image_encoder_->encoderTokenCount();
      ET_CHECK_OR_RETURN_ERROR(num_visual > 0, InvalidState,
                               "Image encoder reports 0 visual tokens");
      image_slots.push_back(ImageSlot{&input, static_cast<int64_t>(ids.size()),
                                      static_cast<int64_t>(num_visual)});
      ids.insert(ids.end(), static_cast<size_t>(num_visual), 0);
    } else if (input.is_audio()) {
      ET_CHECK_OR_RETURN_ERROR(audio_encoder_ != nullptr, InvalidState,
                               "No audio encoder registered");
      const long t_aud_begin = time_in_ms();
      rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "kappa encoding audio");
      auto enc = audio_encoder_->encode(input);
      rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "kappa encoded audio");
      ET_CHECK_OK_OR_RETURN_ERROR(enc.error(), "Audio encoding failed");
      audio_encode_ms += time_in_ms() - t_aud_begin;
      audio_calls += 1;
      // Snapshot the encoder output NOW — see AudioSlot comment above for
      // why the returned EValue's tensor metadata can't survive past the
      // next module_->execute(). num_audio and audio_hidden are read from
      // the tensor directly rather than from encoderTokenCount() so they
      // are guaranteed to reflect THIS encode call.
      auto audio_tensor = enc->toTensor();
      ET_CHECK_OR_RETURN_ERROR(audio_tensor.dim() == 3, InvalidState,
                               "audio_encoder output rank=%zd, expected 3",
                               audio_tensor.dim());
      const int64_t num_audio = static_cast<int64_t>(audio_tensor.size(1));
      const int64_t audio_hidden = static_cast<int64_t>(audio_tensor.size(2));
      rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "kappa encoded audio", num_audio, audio_hidden);
      ET_CHECK_OR_RETURN_ERROR(num_audio > 0, InvalidState,
                               "Audio encoder produced 0 tokens");
      std::vector<uint8_t> bytes(audio_tensor.nbytes());
      std::memcpy(bytes.data(), audio_tensor.const_data_ptr(),
                  audio_tensor.nbytes());
      audio_slots.push_back(AudioSlot{
          std::move(bytes), audio_tensor.scalar_type(),
          static_cast<int64_t>(ids.size()), num_audio, audio_hidden});
      ids.insert(ids.end(), static_cast<size_t>(num_audio), 0);

      // Diagnostic: dump audio encoder output magnitude + first values so
      // the user can see in the JS console whether the encoder is producing
      // real embeddings or zeros/noise. slot.bytes can be either fp32 or
      // fp16 depending on exporter; handle both.
      {
        const AudioSlot &slot = audio_slots.back();
        const size_t nrows = static_cast<size_t>(slot.num_audio);
        const size_t hidden = static_cast<size_t>(slot.audio_hidden);
        const size_t nfloats = nrows * hidden;
        const size_t bytes_per_elem =
            nfloats > 0 ? slot.bytes.size() / nfloats : 0;
        float maxabs = 0.0f;
        double sumsq = 0.0;
        std::string head;
        const size_t headN = std::min<size_t>(16, nfloats);
        if (slot.dtype == ::executorch::aten::ScalarType::Float) {
          const float *e = reinterpret_cast<const float *>(slot.bytes.data());
          for (size_t i = 0; i < nfloats; ++i) {
            const float a = std::fabs(e[i]);
            if (a > maxabs)
              maxabs = a;
            sumsq += static_cast<double>(e[i]) * static_cast<double>(e[i]);
          }
          for (size_t i = 0; i < headN; ++i) {
            if (i)
              head += ", ";
            head += std::to_string(e[i]);
          }
        } else if (slot.dtype == ::executorch::aten::ScalarType::Half) {
          const auto *e = reinterpret_cast<const ::executorch::aten::Half *>(
              slot.bytes.data());
          for (size_t i = 0; i < nfloats; ++i) {
            const float v = static_cast<float>(e[i]);
            const float a = std::fabs(v);
            if (a > maxabs)
              maxabs = a;
            sumsq += static_cast<double>(v) * static_cast<double>(v);
          }
          for (size_t i = 0; i < headN; ++i) {
            if (i)
              head += ", ";
            head += std::to_string(static_cast<float>(e[i]));
          }
        } else {
          head = "<unsupported dtype>";
        }
        const double rms =
            nfloats > 0 ? std::sqrt(sumsq / static_cast<double>(nfloats)) : 0.0;
        rnexecutorch::log(
            rnexecutorch::LOG_LEVEL::Info,
            "kappa [AudioEmbed] num_audio=", nrows, " hidden=", hidden,
            " slot_start=", slot.slot_start,
            " dtype=", static_cast<int>(slot.dtype),
            " bytes_per_elem=", bytes_per_elem, " maxabs=", maxabs,
            " rms=", rms, " first16=", head);
      }
    } else if (input.is_text() || input.is_tokens()) {
      std::vector<uint64_t> tokens;
      if (input.is_text()) {
        auto encode_result = tokenizer_->encode(input.get_text());
        if (!encode_result.ok()) {
          ET_LOG(Error, "Tokenizer encode error %d",
                 static_cast<uint32_t>(encode_result.error()));
          return Error::InvalidArgument;
        }
        tokens = std::move(*encode_result);
      } else {
        tokens = input.get_tokens();
      }
      for (auto t : tokens) {
        ids.push_back(static_cast<int64_t>(t));
      }
    } else {
      ET_LOG(Error, "Unsupported MultimodalInput type");
      return Error::NotSupported;
    }
  }

  const int64_t total_len = static_cast<int64_t>(ids.size());
  ET_CHECK_OR_RETURN_ERROR(total_len > 0, InvalidArgument,
                           "prefill produced zero tokens");

  ET_CHECK_OR_RETURN_ERROR(
      total_len <= prefill_total_cap, InvalidArgument,
      "Prefill length %lld exceeds %s (%lld)",
      static_cast<long long>(total_len),
      enable_dynamic_shape ? "get_max_context_len" : "get_max_seq_len",
      static_cast<long long>(prefill_total_cap));
  if (!enable_dynamic_shape) {
    // Static-shape token_embedding needs fixed-length input; trailing pad
    // zeros are inert because we copy only `total_len` rows out of the
    // embedding output below.
    ids.resize(static_cast<size_t>(max_seq_len), 0);
  }

  // ------------------------------------------------------------
  // Splice diagnostics: dump the fused id stream + slot map so the JS
  // console can confirm placeholder positions (audio/image use id=0)
  // line up with where the encoder outputs will be spliced in pass 2/2b.
  // ------------------------------------------------------------
  {
    std::string ids_dump;
    const size_t dump_n = std::min<size_t>(ids.size(), size_t{512});
    ids_dump.reserve(dump_n * 6);
    for (size_t i = 0; i < dump_n; ++i) {
      if (i) ids_dump += ",";
      ids_dump += std::to_string(ids[i]);
    }
    if (ids.size() > dump_n) ids_dump += ",…";
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[Splice] total_len=", total_len,
                      " ids_buf=", ids.size(),
                      " image_slots=", image_slots.size(),
                      " audio_slots=", audio_slots.size(),
                      " ids[0..", dump_n, "]=", ids_dump);
    for (size_t i = 0; i < image_slots.size(); ++i) {
      const auto &s = image_slots[i];
      rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                        "[Splice] image_slot[", i,
                        "] start=", s.slot_start,
                        " num=", s.num_visual);
    }
    for (size_t i = 0; i < audio_slots.size(); ++i) {
      const auto &s = audio_slots[i];
      rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                        "[Splice] audio_slot[", i,
                        "] start=", s.slot_start,
                        " num=", s.num_audio,
                        " hidden=", s.audio_hidden,
                        " dtype=", static_cast<int>(s.dtype),
                        " bytes=", s.bytes.size());
    }
  }

  // ------------------------------------------------------------
  // Single token_embedding call over the fused id buffer.
  // ------------------------------------------------------------
  const int64_t tok_buf_len = static_cast<int64_t>(ids.size());
  auto token_tensor = ::executorch::extension::from_blob(
      ids.data(), {1, static_cast<SizesType>(tok_buf_len)},
      ::executorch::aten::ScalarType::Long);

  const long t_tokembed_begin = time_in_ms();
  auto embed_result = module_->execute(kTokenEmbeddingMethod, token_tensor);
  ET_CHECK_OK_OR_RETURN_ERROR(embed_result.error());
  auto &embed_outputs = *embed_result;
  const long t_tokembed_end = time_in_ms();

  const size_t expected_outputs = uses_ple ? 2u : 1u;
  ET_CHECK_OR_RETURN_ERROR(embed_outputs.size() == expected_outputs,
                           InvalidState,
                           "Expected %zu output(s) from token_embedding, "
                           "got %zu",
                           expected_outputs, embed_outputs.size());

  auto full_embed = embed_outputs[0].toTensor();
  const auto hidden = static_cast<SizesType>(full_embed.size(2));

  // Own the embeds for the live prefix — subsequent vision_encoder.execute
  // calls may reuse the token_embedding output buffer in the runtime.
  // Dtype is whatever the exporter chose (fp32 baseline, fp16
  // s16k_jitmask_fp16); copy bytes through nbytes/numel so we don't assume the
  // scalar type.
  const ::executorch::aten::ScalarType embeds_dtype = full_embed.scalar_type();
  const size_t embeds_total_numel = static_cast<size_t>(full_embed.numel());
  ET_CHECK_OR_RETURN_ERROR(embeds_total_numel > 0, InvalidState,
                           "token_embedding returned zero elements");
  const size_t embeds_elem_size = full_embed.nbytes() / embeds_total_numel;
  const size_t embeds_prefix_bytes = static_cast<size_t>(total_len) *
                                     static_cast<size_t>(hidden) *
                                     embeds_elem_size;
  std::vector<uint8_t> embeds_buf(embeds_prefix_bytes);
  std::memcpy(embeds_buf.data(), full_embed.mutable_data_ptr(),
              embeds_prefix_bytes);

  // Own the ple_tok prefix similarly. Dtype is whatever the exporter chose
  // (commonly bf16/int8); we copy bytes through nbytes/numel without
  // assuming the scalar type. `ple_elem_size` is hoisted so the chunked
  // text_decoder loop below can use it for byte-offset slicing.
  std::vector<uint8_t> ple_tok_buf;
  SizesType num_layers = 0;
  SizesType ple_dim = 0;
  size_t ple_elem_size = 0;
  ::executorch::aten::ScalarType ple_tok_dtype =
      ::executorch::aten::ScalarType::Float;
  if (uses_ple) {
    auto full_ple_tok = embed_outputs[1].toTensor();
    num_layers = static_cast<SizesType>(full_ple_tok.size(2));
    ple_dim = static_cast<SizesType>(full_ple_tok.size(3));
    ple_tok_dtype = full_ple_tok.scalar_type();
    const size_t total_numel = static_cast<size_t>(full_ple_tok.numel());
    const size_t total_bytes = full_ple_tok.nbytes();
    ET_CHECK_OR_RETURN_ERROR(total_numel > 0, InvalidState,
                             "ple_tok has zero elements");
    ple_elem_size = total_bytes / total_numel;
    const size_t prefix_bytes = static_cast<size_t>(total_len) *
                                static_cast<size_t>(num_layers) *
                                static_cast<size_t>(ple_dim) * ple_elem_size;
    ple_tok_buf.resize(prefix_bytes);
    std::memcpy(ple_tok_buf.data(), full_ple_tok.mutable_data_ptr(),
                prefix_bytes);
  }

  // ------------------------------------------------------------
  // Pass 2: encode images and splice their outputs into embeds_buf.
  // ------------------------------------------------------------
  long vision_total_ms = 0;
  int vision_calls = 0;
  for (const auto &slot : image_slots) {
    const long t_vis_begin = time_in_ms();
    auto encode_result = image_encoder_->encode(*slot.input);
    ET_CHECK_OK_OR_RETURN_ERROR(encode_result.error(), "Image encoding failed");
    encoder_output = *encode_result;

    const auto vision_dtype = vision_tensor.scalar_type();
    const size_t visual_elems =
        static_cast<size_t>(slot.num_visual) * static_cast<size_t>(hidden);
    uint8_t *dst = embeds_buf.data() + static_cast<size_t>(slot.slot_start) *
                                           static_cast<size_t>(hidden) *
                                           embeds_elem_size;
    if (vision_dtype == embeds_dtype) {
      const uint8_t *src =
          static_cast<const uint8_t *>(vision_tensor.const_data_ptr());
      std::memcpy(dst, src, visual_elems * embeds_elem_size);
    } else if (vision_dtype == ::executorch::aten::ScalarType::Float &&
               embeds_dtype == ::executorch::aten::ScalarType::Half) {
      const float *src = vision_tensor.const_data_ptr<float>();
      auto *dst_h = reinterpret_cast<::executorch::aten::Half *>(dst);
      for (size_t i = 0; i < visual_elems; ++i) {
        dst_h[i] = ::executorch::aten::Half(src[i]);
      }
    } else if (vision_dtype == ::executorch::aten::ScalarType::Half &&
               embeds_dtype == ::executorch::aten::ScalarType::Float) {
      const auto *src =
          vision_tensor.const_data_ptr<::executorch::aten::Half>();
      auto *dst_f = reinterpret_cast<float *>(dst);
      for (size_t i = 0; i < visual_elems; ++i) {
        dst_f[i] = static_cast<float>(src[i]);
      }
    } else {
      ET_CHECK_OR_RETURN_ERROR(
          false, InvalidState,
          "unsupported vision/text dtype pair: vision=%hhd text=%hhd",
          static_cast<int8_t>(vision_dtype), static_cast<int8_t>(embeds_dtype));
    }
  }

  // ------------------------------------------------------------
  // Pass 2b: splice encoded audio tokens into embeds_buf. Reads from the
  // byte snapshot taken at encode time so post-encode execute() calls can't
  // invalidate slot state. Same dtype-conversion matrix as vision.
  // ------------------------------------------------------------

  // Diagnostic helper: stringify the first N elements of a byte buffer
  // interpreted as the given scalar dtype (Float or Half supported). Used
  // for the before/src/after snapshots logged per audio slot so the user
  // can verify (a) the destination held pad-token embeds prior to splice,
  // (b) the source bytes carry real audio encoder output, and (c) the
  // destination contains the audio values post-splice.
  auto stringify_floats = [](const uint8_t *p, size_t n,
                             ::executorch::aten::ScalarType dt) -> std::string {
    std::string out;
    out.reserve(n * 10);
    for (size_t i = 0; i < n; ++i) {
      if (i) out += ",";
      float v = 0.0f;
      if (dt == ::executorch::aten::ScalarType::Float) {
        v = reinterpret_cast<const float *>(p)[i];
      } else if (dt == ::executorch::aten::ScalarType::Half) {
        v = static_cast<float>(
            reinterpret_cast<const ::executorch::aten::Half *>(p)[i]);
      }
      char buf[24];
      std::snprintf(buf, sizeof(buf), "%.4f", v);
      out += buf;
    }
    return out;
  };

  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "kappa [Splice] pass 2b begin: audio_slots=",
                    audio_slots.size(), " embeds_buf_bytes=",
                    embeds_buf.size(), " hidden=", hidden,
                    " embeds_dtype=", static_cast<int>(embeds_dtype),
                    " embeds_elem_size=", embeds_elem_size);

  for (auto &slot : audio_slots) {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "kappa splice loop!!!");

    ET_CHECK_OR_RETURN_ERROR(
        slot.audio_hidden == static_cast<int64_t>(hidden), InvalidState,
        "audio encoder hidden %lld != text_embed hidden %lld",
        static_cast<long long>(slot.audio_hidden),
        static_cast<long long>(hidden));

    const auto audio_dtype = slot.dtype;
    const size_t audio_elems =
        static_cast<size_t>(slot.num_audio) * static_cast<size_t>(hidden);
    const size_t audio_elem_size =
        audio_elems > 0 ? slot.bytes.size() / audio_elems : 0;
    ET_CHECK_OR_RETURN_ERROR(
        audio_elem_size > 0 &&
            audio_elem_size * audio_elems == slot.bytes.size(),
        InvalidState,
        "audio slot bytes %zu inconsistent with num_audio=%lld hidden=%lld",
        slot.bytes.size(), static_cast<long long>(slot.num_audio),
        static_cast<long long>(hidden));

    uint8_t *dst = embeds_buf.data() + static_cast<size_t>(slot.slot_start) *
                                           static_cast<size_t>(hidden) *
                                           embeds_elem_size;

    // Snapshot the first row before splice. These bytes should hold the
    // pad-token (id=0) embedding because ids.insert pushed zeros into
    // these slot positions before the token_embedding call. If `before`
    // already equals `src` you are looking at a re-run; if `after` differs
    // from `src` the splice/dtype-cast path is wrong.
    const size_t dbg_n = std::min<size_t>(8, static_cast<size_t>(hidden));
    const std::string before_str =
        stringify_floats(dst, dbg_n, embeds_dtype);
    const std::string src_str =
        stringify_floats(slot.bytes.data(), dbg_n, audio_dtype);

    if (audio_dtype == embeds_dtype) {
      std::memcpy(dst, slot.bytes.data(), audio_elems * embeds_elem_size);
    } else if (audio_dtype == ::executorch::aten::ScalarType::Float &&
               embeds_dtype == ::executorch::aten::ScalarType::Half) {
      const float *src = reinterpret_cast<const float *>(slot.bytes.data());
      auto *dst_h = reinterpret_cast<::executorch::aten::Half *>(dst);
      for (size_t i = 0; i < audio_elems; ++i) {
        dst_h[i] = ::executorch::aten::Half(src[i]);
      }
    } else if (audio_dtype == ::executorch::aten::ScalarType::Half &&
               embeds_dtype == ::executorch::aten::ScalarType::Float) {
      const auto *src = reinterpret_cast<const ::executorch::aten::Half *>(
          slot.bytes.data());
      auto *dst_f = reinterpret_cast<float *>(dst);
      for (size_t i = 0; i < audio_elems; ++i) {
        dst_f[i] = static_cast<float>(src[i]);
      }
    } else {
      ET_CHECK_OR_RETURN_ERROR(
          false, InvalidState,
          "unsupported audio/text dtype pair: audio=%hhd text=%hhd",
          static_cast<int8_t>(audio_dtype), static_cast<int8_t>(embeds_dtype));
    }

    // Post-splice: re-read the same dst row + compute magnitude over the
    // entire spliced region so the user can confirm the bytes flipped to
    // real audio embeds (post should equal src, post_maxabs > 0 always).
    const std::string after_str =
        stringify_floats(dst, dbg_n, embeds_dtype);
    float maxabs = 0.0f;
    double sumsq = 0.0;
    for (size_t i = 0; i < audio_elems; ++i) {
      float v = 0.0f;
      if (embeds_dtype == ::executorch::aten::ScalarType::Float) {
        v = reinterpret_cast<const float *>(dst)[i];
      } else if (embeds_dtype == ::executorch::aten::ScalarType::Half) {
        v = static_cast<float>(
            reinterpret_cast<const ::executorch::aten::Half *>(dst)[i]);
      }
      const float av = std::fabs(v);
      if (av > maxabs) maxabs = av;
      sumsq += static_cast<double>(v) * static_cast<double>(v);
    }
    const double rms =
        audio_elems > 0
            ? std::sqrt(sumsq / static_cast<double>(audio_elems))
            : 0.0;

    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
        "kappa [Splice] audio slot start=", slot.slot_start,
        " num=", slot.num_audio,
        " dtype src=", static_cast<int>(audio_dtype),
        " dst=", static_cast<int>(embeds_dtype),
        " pre[0..", dbg_n, "]=", before_str,
        " src[0..", dbg_n, "]=", src_str,
        " post[0..", dbg_n, "]=", after_str,
        " post_maxabs=", maxabs, " post_rms=", rms);
  }
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "kappa post splice", embeds_buf);

  // ------------------------------------------------------------
  // Chunked text_decoder calls.
  //
  // Some PTEs (Gemma4 iter201) hard-cap text_decoder's S dim at
  // get_max_seq_len (128) while the prefill budget extends to
  // get_max_context_len (2048). KV cache state persists across calls via the
  // absolute input_pos vector, so chunking is functionally transparent to
  // the model. For single-shot static-shape PTEs (LFM2-VL) chunk_cap ==
  // total_len so the loop iterates exactly once — preserving prior behavior.
  // ------------------------------------------------------------
  const int64_t chunk_cap =
      decoder_chunk_size > 0 ? decoder_chunk_size : total_len;
  std::vector<int64_t> cache_positions(static_cast<size_t>(total_len));
  for (int64_t i = 0; i < total_len; ++i) {
    cache_positions[static_cast<size_t>(i)] = start_pos + i;
  }

  const long t_textdec_begin = time_in_ms();
  std::vector<EValue> last_outs;
  const int64_t num_chunks = (total_len + chunk_cap - 1) / chunk_cap;
  for (int64_t ci = 0; ci < num_chunks; ++ci) {
    const int64_t cs = ci * chunk_cap;
    const int64_t ce = std::min(cs + chunk_cap, total_len);
    const int64_t chunk_len = ce - cs;

    uint8_t *embeds_chunk_ptr =
        embeds_buf.data() + static_cast<size_t>(cs) *
                                static_cast<size_t>(hidden) * embeds_elem_size;
    auto embeds_chunk = ::executorch::extension::from_blob(
        embeds_chunk_ptr, {1, static_cast<SizesType>(chunk_len), hidden},
        embeds_dtype);

    TensorPtr ple_chunk;
    if (uses_ple) {
      uint8_t *ple_chunk_ptr =
          ple_tok_buf.data() +
          static_cast<size_t>(cs) * static_cast<size_t>(num_layers) *
              static_cast<size_t>(ple_dim) * ple_elem_size;
      ple_chunk = ::executorch::extension::from_blob(
          ple_chunk_ptr,
          {1, static_cast<SizesType>(chunk_len), num_layers, ple_dim},
          ple_tok_dtype);
    }

    auto pos_chunk = ::executorch::extension::from_blob(
        cache_positions.data() + cs, {static_cast<SizesType>(chunk_len)},
        ::executorch::aten::ScalarType::Long);

    auto res =
        uses_ple
            ? module_->execute(kTextModelMethod,
                               {EValue(*embeds_chunk), EValue(*ple_chunk),
                                EValue(*pos_chunk)})
            : module_->execute(kTextModelMethod,
                               {EValue(*embeds_chunk), EValue(*pos_chunk)});
    ET_CHECK_OK_OR_RETURN_ERROR(res.error());
    last_outs = std::move(*res);
  }
  const long t_textdec_end = time_in_ms();

  ET_CHECK_OR_RETURN_ERROR(!last_outs.empty(), InvalidState,
                           "text_decoder returned no outputs during prefill");

  auto logits = last_outs[0].toTensor();
  const long t_logits_end = time_in_ms();
  start_pos += total_len;

  const long prefill_total = t_logits_end - t_prefill_begin;
  const long tokembed_ms = t_tokembed_end - t_tokembed_begin;
  const long textdec_ms = t_textdec_end - t_textdec_begin;
  const long sample_ms = t_logits_end - t_textdec_end;
  const long overhead_ms =
      prefill_total - tokembed_ms - vision_total_ms - textdec_ms - sample_ms;
  rnexecutorch::log(
      rnexecutorch::LOG_LEVEL::Info, "prefill splits ms: total=", prefill_total,
      " token_embed=", tokembed_ms, " vision(x", vision_calls,
      ")=", vision_total_ms, " audio(x", audio_calls, ")=", audio_encode_ms,
      " text_decoder=", textdec_ms, " logits->token=", sample_ms,
      " overhead=", overhead_ms, " total_len=", total_len,
      " chunks=", num_chunks, " chunk_cap=", chunk_cap,
      " dynamic=", static_cast<int>(enable_dynamic_shape));

  return static_cast<uint64_t>(decoder_runner_->logits_to_token(logits));
}

Error MultimodalPrefiller::load() {
  if (is_method_loaded()) {
    return Error::Ok;
  }
  ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kTokenEmbeddingMethod));
  ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kTextModelMethod));

  auto method_names_result = module_->method_names();
  ET_CHECK_OK_OR_RETURN_ERROR(method_names_result.error(),
                              "Failed to get method names");
  const auto &methods = *method_names_result;

  if (methods.find(kVisionEncoderMethod) != methods.end()) {
    ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kVisionEncoderMethod));
  }
  if (methods.find(kAudioEncoderMethod) != methods.end()) {
    ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kAudioEncoderMethod));
  }
  return Error::Ok;
}

bool MultimodalPrefiller::is_method_loaded() {
  auto methods_res = module_->method_names();
  if (methods_res.error() != Error::Ok) {
    return false;
  }
  if (!module_->is_method_loaded(kTokenEmbeddingMethod) ||
      !module_->is_method_loaded(kTextModelMethod)) {
    return false;
  }
  const auto &methods = *methods_res;
  if (methods.find(kVisionEncoderMethod) != methods.end() &&
      !module_->is_method_loaded(kVisionEncoderMethod)) {
    return false;
  }
  if (methods.find(kAudioEncoderMethod) != methods.end() &&
      !module_->is_method_loaded(kAudioEncoderMethod)) {
    return false;
  }
  return true;
}

} // namespace executorch::extension::llm
