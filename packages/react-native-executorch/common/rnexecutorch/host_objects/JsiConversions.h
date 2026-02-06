#pragma once

#include <codecvt>
#include <cstdint>
#include <set>
#include <span>
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

// Conversion from jsi to C++ types --------------------------------------------

template <typename T> T getValue(const jsi::Value &val, jsi::Runtime &runtime);

template <typename T>
  requires meta::IsNumeric<T>
inline T getValue(const jsi::Value &val, jsi::Runtime &runtime) {
  return static_cast<T>(val.asNumber());
}

template <>
inline bool getValue<bool>(const jsi::Value &val, jsi::Runtime &runtime) {
  return val.asBool();
}

template <>
inline std::string getValue<std::string>(const jsi::Value &val,
                                         jsi::Runtime &runtime) {
  return val.getString(runtime).utf8(runtime);
}

template <>
inline std::u32string getValue<std::u32string>(const jsi::Value &val,
                                               jsi::Runtime &runtime) {
  std::string utf8 = getValue<std::string>(val, runtime);
  std::wstring_convert<std::codecvt_utf8<char32_t>, char32_t> conv;

  return conv.from_bytes(utf8);
}

template <>
inline std::shared_ptr<jsi::Function>
getValue<std::shared_ptr<jsi::Function>>(const jsi::Value &val,
                                         jsi::Runtime &runtime) {
  return std::make_shared<jsi::Function>(
      val.asObject(runtime).asFunction(runtime));
}

template <>
inline JSTensorViewIn getValue<JSTensorViewIn>(const jsi::Value &val,
                                               jsi::Runtime &runtime) {
  jsi::Object obj = val.asObject(runtime);
  JSTensorViewIn tensorView;

  int scalarTypeInt = obj.getProperty(runtime, "scalarType").asNumber();
  tensorView.scalarType = static_cast<ScalarType>(scalarTypeInt);

  jsi::Value shapeValue = obj.getProperty(runtime, "sizes");
  jsi::Array shapeArray = shapeValue.asObject(runtime).asArray(runtime);
  size_t numShapeDims = shapeArray.size(runtime);
  tensorView.sizes.reserve(numShapeDims);

  for (size_t i = 0; i < numShapeDims; ++i) {
    int32_t dim =
        getValue<int32_t>(shapeArray.getValueAtIndex(runtime, i), runtime);
    tensorView.sizes.push_back(dim);
  }

  // On JS side, TensorPtr objects hold a 'data' property which should be either
  // an ArrayBuffer or TypedArray
  jsi::Value dataValue = obj.getProperty(runtime, "dataPtr");
  jsi::Object dataObj = dataValue.asObject(runtime);

  // Check if it's an ArrayBuffer or TypedArray
  if (dataObj.isArrayBuffer(runtime)) {
    jsi::ArrayBuffer arrayBuffer = dataObj.getArrayBuffer(runtime);
    tensorView.dataPtr = arrayBuffer.data(runtime);
  } else {
    // Handle typed arrays (Float32Array, Int32Array, etc.)
    const bool isValidTypedArray = dataObj.hasProperty(runtime, "buffer") &&
                                   dataObj.hasProperty(runtime, "byteOffset") &&
                                   dataObj.hasProperty(runtime, "byteLength") &&
                                   dataObj.hasProperty(runtime, "length");
    if (!isValidTypedArray) {
      throw jsi::JSError(runtime, "Data must be an ArrayBuffer or TypedArray");
    }
    jsi::Value bufferValue = dataObj.getProperty(runtime, "buffer");
    if (!bufferValue.isObject() ||
        !bufferValue.asObject(runtime).isArrayBuffer(runtime)) {
      throw jsi::JSError(runtime,
                         "TypedArray buffer property must be an ArrayBuffer");
    }

    jsi::ArrayBuffer arrayBuffer =
        bufferValue.asObject(runtime).getArrayBuffer(runtime);
    size_t byteOffset =
        getValue<int>(dataObj.getProperty(runtime, "byteOffset"), runtime);

    tensorView.dataPtr =
        static_cast<uint8_t *>(arrayBuffer.data(runtime)) + byteOffset;
  }
  return tensorView;
}

// C++ set from JS array. Set with heterogenerous look-up (adding std::less<>
// enables querying with std::string_view).
template <>
inline std::set<std::string, std::less<>>
getValue<std::set<std::string, std::less<>>>(const jsi::Value &val,
                                             jsi::Runtime &runtime) {

  jsi::Array array = val.asObject(runtime).asArray(runtime);
  size_t length = array.size(runtime);
  std::set<std::string, std::less<>> result;

  for (size_t i = 0; i < length; ++i) {
    jsi::Value element = array.getValueAtIndex(runtime, i);
    result.insert(getValue<std::string>(element, runtime));
  }
  return result;
}

// Helper function to convert typed arrays to std::span
template <typename T>
inline std::span<T> getTypedArrayAsSpan(const jsi::Value &val,
                                        jsi::Runtime &runtime) {
  jsi::Object obj = val.asObject(runtime);

  const bool isValidTypedArray = obj.hasProperty(runtime, "buffer") &&
                                 obj.hasProperty(runtime, "byteOffset") &&
                                 obj.hasProperty(runtime, "byteLength") &&
                                 obj.hasProperty(runtime, "length");
  if (!isValidTypedArray) {
    throw jsi::JSError(runtime, "Value must be a TypedArray");
  }

  // Get the underlying ArrayBuffer
  jsi::Value bufferValue = obj.getProperty(runtime, "buffer");
  if (!bufferValue.isObject() ||
      !bufferValue.asObject(runtime).isArrayBuffer(runtime)) {
    throw jsi::JSError(runtime,
                       "TypedArray buffer property must be an ArrayBuffer");
  }

  jsi::ArrayBuffer arrayBuffer =
      bufferValue.asObject(runtime).getArrayBuffer(runtime);
  size_t byteOffset =
      getValue<size_t>(obj.getProperty(runtime, "byteOffset"), runtime);
  size_t length = getValue<size_t>(obj.getProperty(runtime, "length"), runtime);

  T *dataPtr = reinterpret_cast<T *>(
      static_cast<uint8_t *>(arrayBuffer.data(runtime)) + byteOffset);

  return {dataPtr, length};
}

template <typename T>
inline std::vector<T> getArrayAsVector(const jsi::Value &val,
                                       jsi::Runtime &runtime) {
  jsi::Array array = val.asObject(runtime).asArray(runtime);
  const size_t length = array.size(runtime);
  std::vector<T> result;
  result.reserve(length);

  for (size_t i = 0; i < length; ++i) {
    const jsi::Value element = array.getValueAtIndex(runtime, i);
    result.push_back(getValue<T>(element, runtime));
  }
  return result;
}

// Template specializations for std::vector<T> types
template <>
inline std::vector<JSTensorViewIn>
getValue<std::vector<JSTensorViewIn>>(const jsi::Value &val,
                                      jsi::Runtime &runtime) {
  return getArrayAsVector<JSTensorViewIn>(val, runtime);
}

template <>
inline std::vector<std::string>
getValue<std::vector<std::string>>(const jsi::Value &val,
                                   jsi::Runtime &runtime) {
  return getArrayAsVector<std::string>(val, runtime);
}

template <>
inline std::vector<int32_t>
getValue<std::vector<int32_t>>(const jsi::Value &val, jsi::Runtime &runtime) {
  return getArrayAsVector<int32_t>(val, runtime);
}

template <>
inline std::vector<float> getValue<std::vector<float>>(const jsi::Value &val,
                                                       jsi::Runtime &runtime) {
  return getArrayAsVector<float>(val, runtime);
}

template <>
inline std::vector<int64_t>
getValue<std::vector<int64_t>>(const jsi::Value &val, jsi::Runtime &runtime) {
  return getArrayAsVector<int64_t>(val, runtime);
}

template <>
inline std::vector<uint64_t>
getValue<std::vector<uint64_t>>(const jsi::Value &val, jsi::Runtime &runtime) {
  return getArrayAsVector<uint64_t>(val, runtime);
}

// Template specializations for std::span<T> types
template <>
inline std::span<float> getValue<std::span<float>>(const jsi::Value &val,
                                                   jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<float>(val, runtime);
}

template <>
inline std::span<double> getValue<std::span<double>>(const jsi::Value &val,
                                                     jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<double>(val, runtime);
}

template <>
inline std::span<int32_t> getValue<std::span<int32_t>>(const jsi::Value &val,
                                                       jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<int32_t>(val, runtime);
}

template <>
inline std::span<uint32_t>
getValue<std::span<uint32_t>>(const jsi::Value &val, jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<uint32_t>(val, runtime);
}

template <>
inline std::span<int16_t> getValue<std::span<int16_t>>(const jsi::Value &val,
                                                       jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<int16_t>(val, runtime);
}

template <>
inline std::span<uint16_t>
getValue<std::span<uint16_t>>(const jsi::Value &val, jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<uint16_t>(val, runtime);
}

template <>
inline std::span<int8_t> getValue<std::span<int8_t>>(const jsi::Value &val,
                                                     jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<int8_t>(val, runtime);
}

template <>
inline std::span<uint8_t> getValue<std::span<uint8_t>>(const jsi::Value &val,
                                                       jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<uint8_t>(val, runtime);
}

template <>
inline std::span<int64_t> getValue<std::span<int64_t>>(const jsi::Value &val,
                                                       jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<int64_t>(val, runtime);
}

template <>
inline std::span<uint64_t>
getValue<std::span<uint64_t>>(const jsi::Value &val, jsi::Runtime &runtime) {
  return getTypedArrayAsSpan<uint64_t>(val, runtime);
}

// Conversion from C++ types to jsi --------------------------------------------

// Implementation functions might return any type, but in a promise we can only
// return jsi::Value or jsi::Object. For each type being returned
// we add a function here.

inline jsi::Value getJsiValue(std::shared_ptr<jsi::Object> valuePtr,
                              jsi::Runtime &runtime) {
  return std::move(*valuePtr);
}

inline jsi::Value getJsiValue(const std::vector<int32_t> &vec,
                              jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    array.setValueAtIndex(runtime, i, jsi::Value(static_cast<int>(vec[i])));
  }
  return {runtime, array};
}

inline jsi::Value getJsiValue(const std::vector<uint64_t> &vec,
                              jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    array.setValueAtIndex(runtime, i, jsi::Value(static_cast<double>(vec[i])));
  }
  return {runtime, array};
}

inline jsi::Value getJsiValue(const std::vector<float> &vec,
                              jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    array.setValueAtIndex(runtime, i, jsi::Value(vec[i]));
  }
  return {runtime, array};
}

inline jsi::Value getJsiValue(const std::vector<std::string> &vec,
                              jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    array.setValueAtIndex(runtime, i,
                          jsi::String::createFromUtf8(runtime, vec[i]));
  }
  return {runtime, array};
}

inline jsi::Value getJsiValue(const std::vector<char> &vec,
                              jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    array.setValueAtIndex(runtime, i, jsi::Value(vec[i]));
  }
  return {runtime, array};
}

// Conditional as on android, size_t and uint64_t reduce to the same type,
// introducing ambiguity
template <typename T,
          typename = std::enable_if_t<std::is_same_v<T, size_t> &&
                                      !std::is_same_v<size_t, uint64_t>>>
inline jsi::Value getJsiValue(T val, jsi::Runtime &runtime) {
  return jsi::Value(static_cast<double>(val));
}

inline jsi::Value getJsiValue(uint64_t val, jsi::Runtime &runtime) {
  jsi::BigInt bigInt = jsi::BigInt::fromUint64(runtime, val);
  return {runtime, bigInt};
}

inline jsi::Value getJsiValue(int val, jsi::Runtime &runtime) {
  return {runtime, val};
}

inline jsi::Value getJsiValue(bool val, jsi::Runtime &runtime) {
  return jsi::Value(val);
}

inline jsi::Value getJsiValue(const std::shared_ptr<OwningArrayBuffer> &buf,
                              jsi::Runtime &runtime) {
  jsi::ArrayBuffer arrayBuffer(runtime, buf);
  return {runtime, arrayBuffer};
}

inline jsi::Value
getJsiValue(const std::vector<std::shared_ptr<OwningArrayBuffer>> &vec,
            jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    jsi::ArrayBuffer arrayBuffer(runtime, vec[i]);
    array.setValueAtIndex(runtime, i, jsi::Value(runtime, arrayBuffer));
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
                          jsi::Value(static_cast<int>(vec[i].scalarType)));

    jsi::ArrayBuffer arrayBuffer(runtime, vec[i].dataPtr);
    tensorObj.setProperty(runtime, "dataPtr", arrayBuffer);

    array.setValueAtIndex(runtime, i, tensorObj);
  }
  return {runtime, array};
}

inline jsi::Value getJsiValue(const std::string &str, jsi::Runtime &runtime) {
  return jsi::String::createFromUtf8(runtime, str);
}

inline jsi::Value
getJsiValue(const std::unordered_map<std::string_view, float> &map,
            jsi::Runtime &runtime) {
  jsi::Object mapObj{runtime};
  for (auto &[k, v] : map) {
    // The string_view keys must be null-terminated!
    mapObj.setProperty(runtime, k.data(), v);
  }
  return mapObj;
}

inline jsi::Value getJsiValue(
    const std::vector<models::object_detection::types::Detection> &detections,
    jsi::Runtime &runtime) {
  jsi::Array array(runtime, detections.size());
  for (std::size_t i = 0; i < detections.size(); ++i) {
    jsi::Object detection(runtime);
    jsi::Object bbox(runtime);
    bbox.setProperty(runtime, "x1", detections[i].x1);
    bbox.setProperty(runtime, "y1", detections[i].y1);
    bbox.setProperty(runtime, "x2", detections[i].x2);
    bbox.setProperty(runtime, "y2", detections[i].y2);

    detection.setProperty(runtime, "bbox", bbox);
    detection.setProperty(
        runtime, "label",
        jsi::String::createFromAscii(
            runtime, models::object_detection::constants::kCocoLablesMap.at(
                         detections[i].label)));
    detection.setProperty(runtime, "score", detections[i].score);
    array.setValueAtIndex(runtime, i, detection);
  }
  return array;
}

inline jsi::Value
getJsiValue(const std::vector<models::ocr::types::OCRDetection> &detections,
            jsi::Runtime &runtime) {
  auto jsiDetections = jsi::Array(runtime, detections.size());
  for (size_t i = 0; i < detections.size(); ++i) {
    const auto &detection = detections[i];

    auto jsiDetectionObject = jsi::Object(runtime);

    auto jsiBboxArray = jsi::Array(runtime, 4);
#pragma unroll
    for (size_t j = 0; j < 4u; ++j) {
      auto jsiPointObject = jsi::Object(runtime);
      jsiPointObject.setProperty(runtime, "x", detection.bbox[j].x);
      jsiPointObject.setProperty(runtime, "y", detection.bbox[j].y);
      jsiBboxArray.setValueAtIndex(runtime, j, jsiPointObject);
    }

    jsiDetectionObject.setProperty(runtime, "bbox", jsiBboxArray);
    jsiDetectionObject.setProperty(
        runtime, "text", jsi::String::createFromUtf8(runtime, detection.text));
    jsiDetectionObject.setProperty(runtime, "score", detection.score);

    jsiDetections.setValueAtIndex(runtime, i, jsiDetectionObject);
  }

  return jsiDetections;
}

inline jsi::Value
getJsiValue(const std::vector<models::voice_activity_detection::types::Segment>
                &speechSegments,
            jsi::Runtime &runtime) {
  auto jsiSegments = jsi::Array(runtime, speechSegments.size());
  for (size_t i = 0; i < speechSegments.size(); i++) {
    const auto &[start, end] = speechSegments[i];
    auto jsiSegmentObject = jsi::Object(runtime);
    jsiSegmentObject.setProperty(runtime, "start", static_cast<int>(start));
    jsiSegmentObject.setProperty(runtime, "end", static_cast<int>(end));
    jsiSegments.setValueAtIndex(runtime, i, jsiSegmentObject);
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

  obj.setProperty(runtime, "avg_logprob", seg.avgLogprob);
  obj.setProperty(runtime, "compression_ratio", seg.compressionRatio);
  obj.setProperty(runtime, "temperature", seg.temperature);
  obj.setProperty(runtime, "no_speech_prob", seg.noSpeechProbability);

  jsi::Array wordsAry(runtime, seg.words.size());
  for (size_t i = 0; i < seg.words.size(); ++i) {
    jsi::Object wordObj(runtime);
    wordObj.setProperty(
        runtime, "word",
        jsi::String::createFromUtf8(runtime, seg.words[i].content));
    wordObj.setProperty(runtime, "start",
                        static_cast<double>(seg.words[i].start));
    wordObj.setProperty(runtime, "end", static_cast<double>(seg.words[i].end));

    wordsAry.setValueAtIndex(runtime, i, wordObj);
  }
  obj.setProperty(runtime, "words", wordsAry);

  jsi::Array tokensAry(runtime, seg.tokens.size());
  for (size_t i = 0; i < seg.tokens.size(); ++i) {
    tokensAry.setValueAtIndex(runtime, i, static_cast<double>(seg.tokens[i]));
  }
  obj.setProperty(runtime, "tokens", tokensAry);

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

    jsi::Array segmentsAry(runtime, result.segments.size());
    for (size_t i = 0; i < result.segments.size(); ++i) {
      segmentsAry.setValueAtIndex(runtime, i,
                                  getJsiValue(result.segments[i], runtime));
    }
    obj.setProperty(runtime, "segments", segmentsAry);
  }

  return obj;
}
} // namespace rnexecutorch::jsi_conversion
