#pragma once

#include <set>
#include <type_traits>
#include <unordered_map>

#include <executorch/runtime/core/exec_aten/util/scalar_type_util.h>
#include <jsi/jsi.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/host_objects/JSTensorViewOut.h>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>

#include <rnexecutorch/metaprogramming/TypeConcepts.h>
#include <rnexecutorch/models/object_detection/Constants.h>
#include <rnexecutorch/models/object_detection/Utils.h>

namespace rnexecutorch::jsiconversion {

using namespace facebook;

// Conversion from jsi to C++ types --------------------------------------------

template <typename T> T getValue(const jsi::Value &val, jsi::Runtime &runtime);

template <typename T>
  requires meta::IsNumeric<T>
inline T getValue(const jsi::Value &val, jsi::Runtime &runtime) {
  static_assert(std::is_integral<T>::value || std::is_floating_point<T>::value,
                "Only integral and floating-point types are supported");
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
inline std::vector<int32_t>
getValue<std::vector<int32_t>>(const jsi::Value &val, jsi::Runtime &runtime) {
  jsi::Array array = val.asObject(runtime).asArray(runtime);
  size_t length = array.size(runtime);
  std::vector<int32_t> result;
  result.reserve(length);

  for (size_t i = 0; i < length; ++i) {
    jsi::Value element = array.getValueAtIndex(runtime, i);
    result.push_back(getValue<int32_t>(element, runtime));
  }
  return result;
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
    int dim = getValue<int>(shapeArray.getValueAtIndex(runtime, i), runtime);
    tensorView.sizes.push_back(static_cast<int32_t>(dim));
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

template <>
inline std::vector<JSTensorViewIn>
getValue<std::vector<JSTensorViewIn>>(const jsi::Value &val,
                                      jsi::Runtime &runtime) {
  jsi::Array array = val.asObject(runtime).asArray(runtime);
  size_t length = array.size(runtime);
  std::vector<JSTensorViewIn> result;
  result.reserve(length);

  for (size_t i = 0; i < length; ++i) {
    jsi::Value element = array.getValueAtIndex(runtime, i);
    result.push_back(getValue<JSTensorViewIn>(element, runtime));
  }
  return result;
}

template <>
inline std::vector<std::string>
getValue<std::vector<std::string>>(const jsi::Value &val,
                                   jsi::Runtime &runtime) {
  jsi::Array array = val.asObject(runtime).asArray(runtime);
  size_t length = array.size(runtime);
  std::vector<std::string> result;
  result.reserve(length);

  for (size_t i = 0; i < length; ++i) {
    jsi::Value element = array.getValueAtIndex(runtime, i);
    result.push_back(getValue<std::string>(element, runtime));
  }
  return result;
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
  return jsi::Value(runtime, array);
}

inline jsi::Value getJsiValue(int val, jsi::Runtime &runtime) {
  return jsi::Value(runtime, val);
}

inline jsi::Value
getJsiValue(const std::vector<std::shared_ptr<OwningArrayBuffer>> &vec,
            jsi::Runtime &runtime) {
  jsi::Array array(runtime, vec.size());
  for (size_t i = 0; i < vec.size(); i++) {
    jsi::ArrayBuffer arrayBuffer(runtime, vec[i]);
    array.setValueAtIndex(runtime, i, jsi::Value(runtime, arrayBuffer));
  }
  return jsi::Value(runtime, array);
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
  return jsi::Value(runtime, array);
}

inline jsi::Value getJsiValue(const std::shared_ptr<OwningArrayBuffer> &buf,
                              jsi::Runtime &runtime) {
  jsi::ArrayBuffer arrayBuffer(runtime, buf);
  return jsi::Value(runtime, arrayBuffer);
}

inline jsi::Value getJsiValue(const std::string &str, jsi::Runtime &runtime) {
  return jsi::String::createFromAscii(runtime, str);
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

inline jsi::Value getJsiValue(const std::vector<Detection> &detections,
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
    detection.setProperty(runtime, "label",
                          jsi::String::createFromAscii(
                              runtime, cocoLabelsMap.at(detections[i].label)));
    detection.setProperty(runtime, "score", detections[i].score);
    array.setValueAtIndex(runtime, i, detection);
  }
  return array;
}

} // namespace rnexecutorch::jsiconversion