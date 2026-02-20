#pragma once

#include <codecvt>
#include <concepts>
#include <cstdint>
#include <functional> // Required for std::less
#include <locale>
#include <set>
#include <span>
#include <string>
#include <type_traits>
#include <unordered_map>
#include <vector>

#include <executorch/runtime/core/exec_aten/util/scalar_type_util.h>
#include <jsi/jsi.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/host_objects/JSTensorViewOut.h>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>

#include <rnexecutorch/metaprogramming/TypeConcepts.h>
#include <rnexecutorch/models/object_detection/Constants.h>
#include <rnexecutorch/models/object_detection/Types.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <rnexecutorch/models/speech_to_text/types/Segment.h>
#include <rnexecutorch/models/speech_to_text/types/TranscriptionResult.h>
#include <rnexecutorch/models/voice_activity_detection/Types.h>

using namespace rnexecutorch::models::speech_to_text::types;

namespace rnexecutorch::jsi_conversion {

using namespace facebook;

// =================================================================================================
// HELPERS (Internal)
// =================================================================================================
namespace detail {

template <typename T>
inline std::pair<T *, size_t> getTypedArrayData(const jsi::Value &val,
                                                jsi::Runtime &runtime) {
  jsi::Object obj = val.asObject(runtime);

  if (obj.isArrayBuffer(runtime)) {
    jsi::ArrayBuffer buffer = obj.getArrayBuffer(runtime);
    return {reinterpret_cast<T *>(buffer.data(runtime)),
            buffer.size(runtime) / sizeof(T)};
  }

  bool isValidTypedArray = obj.hasProperty(runtime, "buffer") &&
                           obj.hasProperty(runtime, "byteOffset") &&
                           obj.hasProperty(runtime, "byteLength") &&
                           obj.hasProperty(runtime, "length");

  if (!isValidTypedArray) {
    throw jsi::JSError(runtime, "Value must be an ArrayBuffer or TypedArray");
  }

  jsi::Value bufferValue = obj.getProperty(runtime, "buffer");
  if (!bufferValue.isObject() ||
      !bufferValue.asObject(runtime).isArrayBuffer(runtime)) {
    throw jsi::JSError(runtime, "TypedArray buffer must be an ArrayBuffer");
  }

  jsi::ArrayBuffer arrayBuffer =
      bufferValue.asObject(runtime).getArrayBuffer(runtime);
  size_t byteOffset =
      static_cast<size_t>(obj.getProperty(runtime, "byteOffset").asNumber());
  size_t length =
      static_cast<size_t>(obj.getProperty(runtime, "length").asNumber());

  uint8_t *rawData = arrayBuffer.data(runtime) + byteOffset;
  return {reinterpret_cast<T *>(rawData), length};
}

} // namespace detail

// =================================================================================================
// JS -> C++ (JsiGetter Struct)
// We use a struct to allow partial specialization for vectors/spans
// =================================================================================================

// Forward Declaration
template <typename T> struct JsiGetter;

// Public API Wrapper
template <typename T> T getValue(const jsi::Value &val, jsi::Runtime &runtime) {
  return JsiGetter<T>::get(val, runtime);
}

template <typename T> struct JsiGetter {
  static T get(const jsi::Value &val, jsi::Runtime &runtime) {
    if constexpr (meta::IsNumeric<T>) {
      return static_cast<T>(val.asNumber());
    } else {
      // Fallback for unsupported types
      throw jsi::JSError(runtime, "Unsupported type conversion");
    }
  }
};

template <> struct JsiGetter<bool> {
  static bool get(const jsi::Value &val, jsi::Runtime &runtime) {
    return val.asBool();
  }
};

template <> struct JsiGetter<std::string> {
  static std::string get(const jsi::Value &val, jsi::Runtime &runtime) {
    return val.getString(runtime).utf8(runtime);
  }
};

template <> struct JsiGetter<std::u32string> {
  static std::u32string get(const jsi::Value &val, jsi::Runtime &runtime) {
    std::string utf8 = getValue<std::string>(val, runtime);
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    std::wstring_convert<std::codecvt_utf8<char32_t>, char32_t> conv;
    return conv.from_bytes(utf8);
#pragma clang diagnostic pop
  }
};

template <> struct JsiGetter<std::shared_ptr<jsi::Function>> {
  static std::shared_ptr<jsi::Function> get(const jsi::Value &val,
                                            jsi::Runtime &runtime) {
    return std::make_shared<jsi::Function>(
        val.asObject(runtime).asFunction(runtime));
  }
};

template <> struct JsiGetter<JSTensorViewIn> {
  static JSTensorViewIn get(const jsi::Value &val, jsi::Runtime &runtime) {
    jsi::Object obj = val.asObject(runtime);
    JSTensorViewIn tensorView;

    tensorView.scalarType = static_cast<ScalarType>(
        static_cast<int>(obj.getProperty(runtime, "scalarType").asNumber()));

    jsi::Array shapeArray =
        obj.getProperty(runtime, "sizes").asObject(runtime).asArray(runtime);
    size_t numDims = shapeArray.size(runtime);
    tensorView.sizes.reserve(numDims);

    for (size_t i = 0; i < numDims; ++i) {
      tensorView.sizes.push_back(static_cast<int32_t>(
          shapeArray.getValueAtIndex(runtime, i).asNumber()));
    }

    // On JS side, TensorPtr objects hold a 'data' property which should be
    // either an ArrayBuffer or TypedArray
    auto [ptr, _] = detail::getTypedArrayData<uint8_t>(
        obj.getProperty(runtime, "dataPtr"), runtime);
    tensorView.dataPtr = ptr;

    return tensorView;
  }
};

// C++ set from JS array. Set with heterogenerous look-up (adding std::less<>
// enables querying with std::string_view).
template <> struct JsiGetter<std::set<std::string, std::less<>>> {
  static std::set<std::string, std::less<>> get(const jsi::Value &val,
                                                jsi::Runtime &runtime) {
    jsi::Array array = val.asObject(runtime).asArray(runtime);
    size_t length = array.size(runtime);
    std::set<std::string, std::less<>> result;

    for (size_t i = 0; i < length; ++i) {
      // Explicitly get string to avoid ambiguity
      result.insert(
          getValue<std::string>(array.getValueAtIndex(runtime, i), runtime));
    }
    return result;
  }
};

template <typename T> struct JsiGetter<std::vector<T>> {
  static std::vector<T> get(const jsi::Value &val, jsi::Runtime &runtime) {
    jsi::Array array = val.asObject(runtime).asArray(runtime);
    size_t length = array.size(runtime);
    std::vector<T> result;
    result.reserve(length);

    for (size_t i = 0; i < length; ++i) {
      result.push_back(getValue<T>(array.getValueAtIndex(runtime, i), runtime));
    }
    return result;
  }
};

template <typename T> struct JsiGetter<std::span<T>> {
  static std::span<T> get(const jsi::Value &val, jsi::Runtime &runtime) {
    auto [ptr, len] = detail::getTypedArrayData<T>(val, runtime);
    return std::span<T>{ptr, len};
  }
};

// =================================================================================================
// C++ -> JS (getJsiValue)
// =================================================================================================

inline jsi::Value getJsiValue(int val, jsi::Runtime & /*runtime*/) {
  return {val};
}
inline jsi::Value getJsiValue(bool val, jsi::Runtime & /*runtime*/) {
  return {val};
}
inline jsi::Value getJsiValue(double val, jsi::Runtime & /*runtime*/) {
  return {val};
}
inline jsi::Value getJsiValue(float val, jsi::Runtime & /*runtime*/) {
  return {static_cast<double>(val)};
}

template <typename T,
          typename = std::enable_if_t<std::is_same_v<T, size_t> &&
                                      !std::is_same_v<size_t, uint64_t>>>
inline jsi::Value getJsiValue(T val, jsi::Runtime &runtime) {
  return {static_cast<double>(val)};
}

inline jsi::Value getJsiValue(uint64_t val, jsi::Runtime &runtime) {
  jsi::BigInt bigInt = jsi::BigInt::fromUint64(runtime, val);
  return {runtime, bigInt};
}

inline jsi::Value getJsiValue(const std::string &str, jsi::Runtime &runtime) {
  return jsi::String::createFromUtf8(runtime, str);
}

inline jsi::Value getJsiValue(std::shared_ptr<jsi::Object> valuePtr,
                              jsi::Runtime &runtime) {
  return std::move(*valuePtr);
}

inline jsi::Value getJsiValue(const std::shared_ptr<OwningArrayBuffer> &buf,
                              jsi::Runtime &runtime) {
  jsi::ArrayBuffer arrayBuffer(runtime, buf);
  return {runtime, arrayBuffer};
}

template <typename T>
inline jsi::Value getJsiValue(const std::vector<T> &vec,
                              jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); ++i) {
    if constexpr (std::is_same_v<T, size_t> &&
                  !std::is_same_v<size_t, uint64_t>) {
      // Conditional as on android, size_t and uint64_t reduce to the same type,
      // introducing ambiguity
      array.setValueAtIndex(runtime, i, static_cast<double>(vec[i]));
    } else {
      array.setValueAtIndex(runtime, i, getJsiValue(vec[i], runtime));
    }
  }
  return {runtime, array};
}

inline jsi::Value getJsiValue(const std::vector<JSTensorViewOut> &vec,
                              jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    jsi::Object tensorObj(runtime);
    tensorObj.setProperty(runtime, "sizes", getJsiValue(vec[i].sizes, runtime));
    tensorObj.setProperty(runtime, "scalarType",
                          static_cast<int>(vec[i].scalarType));
    tensorObj.setProperty(runtime, "dataPtr",
                          jsi::ArrayBuffer(runtime, vec[i].dataPtr));
    array.setValueAtIndex(runtime, i, tensorObj);
  }
  return {runtime, array};
}

inline jsi::Value
getJsiValue(const std::unordered_map<std::string_view, float> &map,
            jsi::Runtime &runtime) {
  jsi::Object mapObj{runtime};
  for (auto &[k, v] : map) {
    mapObj.setProperty(runtime, k.data(), v);
  }
  return mapObj;
}

inline jsi::Value getJsiValue(
    const std::vector<models::object_detection::types::Detection> &detections,
    jsi::Runtime &runtime) {
  jsi::Array array(runtime, detections.size());
  for (size_t i = 0; i < detections.size(); ++i) {
    const auto &d = detections[i];
    jsi::Object detection(runtime);
    jsi::Object bbox(runtime);

    bbox.setProperty(runtime, "x1", d.x1);
    bbox.setProperty(runtime, "y1", d.y1);
    bbox.setProperty(runtime, "x2", d.x2);
    bbox.setProperty(runtime, "y2", d.y2);

    detection.setProperty(runtime, "bbox", bbox);
    detection.setProperty(
        runtime, "label",
        jsi::String::createFromAscii(
            runtime,
            models::object_detection::constants::kCocoLablesMap.at(d.label)));
    detection.setProperty(runtime, "score", d.score);
    array.setValueAtIndex(runtime, i, detection);
  }
  return array;
}

inline jsi::Value
getJsiValue(const std::vector<models::ocr::types::OCRDetection> &detections,
            jsi::Runtime &runtime) {
  auto jsiDetections = jsi::Array(runtime, detections.size());
  for (size_t i = 0; i < detections.size(); ++i) {
    const auto &d = detections[i];
    auto jsiDetection = jsi::Object(runtime);
    auto jsiBbox = jsi::Array(runtime, 4);

    for (size_t j = 0; j < 4u; ++j) {
      auto point = jsi::Object(runtime);
      point.setProperty(runtime, "x", d.bbox[j].x);
      point.setProperty(runtime, "y", d.bbox[j].y);
      jsiBbox.setValueAtIndex(runtime, j, point);
    }

    jsiDetection.setProperty(runtime, "bbox", jsiBbox);
    jsiDetection.setProperty(runtime, "text",
                             jsi::String::createFromUtf8(runtime, d.text));
    jsiDetection.setProperty(runtime, "score", d.score);
    jsiDetections.setValueAtIndex(runtime, i, jsiDetection);
  }
  return jsiDetections;
}

inline jsi::Value
getJsiValue(const std::vector<models::voice_activity_detection::types::Segment>
                &segments,
            jsi::Runtime &runtime) {
  auto jsiSegments = jsi::Array(runtime, segments.size());
  for (size_t i = 0; i < segments.size(); i++) {
    auto segObj = jsi::Object(runtime);
    segObj.setProperty(runtime, "start",
                       static_cast<double>(segments[i].start));
    segObj.setProperty(runtime, "end", static_cast<double>(segments[i].end));
    jsiSegments.setValueAtIndex(runtime, i, segObj);
  }
  return jsiSegments;
}

inline jsi::Value getJsiValue(const Segment &seg, jsi::Runtime &runtime) {
  jsi::Object obj(runtime);
  obj.setProperty(runtime, "start", seg.start);
  obj.setProperty(runtime, "end", seg.end);

  std::string segText;
  for (const auto &w : seg.words)
    segText += w.content;
  obj.setProperty(runtime, "text",
                  jsi::String::createFromUtf8(runtime, segText));

  obj.setProperty(runtime, "avgLogprob", seg.avgLogprob);
  obj.setProperty(runtime, "compressionRatio", seg.compressionRatio);
  obj.setProperty(runtime, "temperature", seg.temperature);

  jsi::Array wordsArray(runtime, seg.words.size());
  for (size_t i = 0; i < seg.words.size(); ++i) {
    jsi::Object wordObj(runtime);
    wordObj.setProperty(
        runtime, "word",
        jsi::String::createFromUtf8(runtime, seg.words[i].content));
    wordObj.setProperty(runtime, "start",
                        static_cast<double>(seg.words[i].start));
    wordObj.setProperty(runtime, "end", static_cast<double>(seg.words[i].end));

    wordsArray.setValueAtIndex(runtime, i, wordObj);
  }
  obj.setProperty(runtime, "words", wordsArray);

  jsi::Array tokensArray(runtime, seg.tokens.size());
  for (size_t i = 0; i < seg.tokens.size(); ++i) {
    tokensArray.setValueAtIndex(runtime, i, static_cast<double>(seg.tokens[i]));
  }
  obj.setProperty(runtime, "tokens", tokensArray);

  return obj;
}

inline jsi::Value getJsiValue(const TranscriptionResult &result,
                              jsi::Runtime &runtime) {
  jsi::Object obj(runtime);
  obj.setProperty(runtime, "text",
                  jsi::String::createFromUtf8(runtime, result.text));

  if (!result.segments.empty() || !result.language.empty()) {
    obj.setProperty(runtime, "task",
                    jsi::String::createFromUtf8(runtime, result.task));
    if (!result.language.empty()) {
      obj.setProperty(runtime, "language",
                      jsi::String::createFromUtf8(runtime, result.language));
    }
    obj.setProperty(runtime, "duration", result.duration);

    jsi::Array segmentsArray(runtime, result.segments.size());
    for (size_t i = 0; i < result.segments.size(); ++i) {
      segmentsArray.setValueAtIndex(runtime, i,
                                    getJsiValue(result.segments[i], runtime));
    }
    obj.setProperty(runtime, "segments", segmentsArray);
  }

  return obj;
}
} // namespace rnexecutorch::jsi_conversion
