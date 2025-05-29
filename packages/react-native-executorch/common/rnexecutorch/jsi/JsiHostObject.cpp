#include "JsiHostObject.h"

//  set this value to 1 in order to debug the construction/destruction
#define JSI_DEBUG_ALLOCATIONS 1

namespace rnexecutorch {

#if JSI_DEBUG_ALLOCATIONS
int objCounter = 0;
std::vector<JsiHostObject *> objects;
#endif

JsiHostObject::JsiHostObject() {
  getters_ = std::make_unique<std::unordered_map<
      std::string, jsi::Value (JsiHostObject::*)(jsi::Runtime &)>>();
  functions_ = std::make_unique<
      std::unordered_map<std::string, jsi::Value (JsiHostObject::*)(
                                          jsi::Runtime &, const jsi::Value &,
                                          const jsi::Value *, size_t)>>();
  setters_ = std::make_unique<std::unordered_map<
      std::string,
      void (JsiHostObject::*)(jsi::Runtime &, const jsi::Value &)>>();

#if JSI_DEBUG_ALLOCATIONS
  objects.push_back(this);
  objCounter++;
#endif
}

JsiHostObject::~JsiHostObject() {
#if JSI_DEBUG_ALLOCATIONS
  for (size_t i = 0; i < objects.size(); ++i) {
    if (objects.at(i) == this) {
      objects.erase(objects.begin() + i);
      break;
    }
  }
  objCounter--;
#endif
}

std::vector<jsi::PropNameID> JsiHostObject::getPropertyNames(jsi::Runtime &rt) {
  std::vector<jsi::PropNameID> propertyNames;
  propertyNames.reserve(getters_->size() + functions_->size() +
                        setters_->size());

  for (const auto &it : *getters_) {
    propertyNames.push_back(jsi::PropNameID::forUtf8(rt, it.first));
  }

  for (const auto &it : *functions_) {
    propertyNames.push_back(jsi::PropNameID::forAscii(rt, it.first));
  }

  for (const auto &it : *setters_) {
    propertyNames.push_back(jsi::PropNameID::forAscii(rt, it.first));
  }

  return propertyNames;
}

jsi::Value JsiHostObject::get(jsi::Runtime &runtime,
                              const jsi::PropNameID &name) {
  auto nameAsString = name.utf8(runtime);
  auto &hostFunctionCache = hostFunctionCache_.get(runtime);

  auto cachedFunction = hostFunctionCache.find(nameAsString);
  if (cachedFunction != hostFunctionCache.end()) {
    return cachedFunction->second.asFunction(runtime);
  }

  auto getter = getters_->find(nameAsString);
  if (getter != getters_->end()) {
    auto dispatcher = std::bind(getter->second, this, std::placeholders::_1);

    return dispatcher(runtime);
  }

  auto function = functions_->find(nameAsString);
  if (function == functions_->end()) {
    return jsi::Value::undefined();
  }

  auto dispatcher =
      std::bind(function->second, reinterpret_cast<JsiHostObject *>(this),
                std::placeholders::_1, std::placeholders::_2,
                std::placeholders::_3, std::placeholders::_4);

  return hostFunctionCache
      .emplace(nameAsString, jsi::Function::createFromHostFunction(
                                 runtime, name, 0, dispatcher))
      .first->second.asFunction(runtime);
}

void JsiHostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name,
                        const jsi::Value &value) {
  auto nameAsString = name.utf8(runtime);

  auto setter = setters_->find(nameAsString);

  if (setter != setters_->end()) {
    auto dispatcher = std::bind(setter->second, this, std::placeholders::_1,
                                std::placeholders::_2);

    return dispatcher(runtime, value);
  }
}
} // namespace rnexecutorch