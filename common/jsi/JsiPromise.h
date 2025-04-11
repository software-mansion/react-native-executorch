#pragma once

#include <ReactCommon/CallInvoker.h>
#include <functional>
#include <jsi/jsi.h>
#include <memory>
#include <string>
#include <utility>

namespace rnexecutorch {

using namespace facebook;

class Promise {
public:
  Promise(std::function<void(const std::function<jsi::Value(jsi::Runtime &)>)>
              resolve,
          std::function<void(const std::string &)> reject)
      : resolve_(std::move(resolve)), reject_(std::move(reject)) {}

  void resolve(const std::function<jsi::Value(jsi::Runtime &)> &resolver) {
    resolve_(std::forward<const std::function<jsi::Value(jsi::Runtime &)>>(
        resolver));
  }

  void reject(const std::string &errorMessage) { reject_(errorMessage); }

private:
  std::function<void(const std::function<jsi::Value(jsi::Runtime &)>)> resolve_;
  std::function<void(const std::string &)> reject_;
};

class PromiseVendor {
public:
  PromiseVendor(jsi::Runtime *runtime,
                const std::shared_ptr<react::CallInvoker> &callInvoker)
      : runtime_(runtime), callInvoker_(callInvoker) {}

  jsi::Value
  createPromise(const std::function<void(std::shared_ptr<Promise>)> &function);

private:
  jsi::Runtime *runtime_;
  std::shared_ptr<react::CallInvoker> callInvoker_;
};

} // namespace rnexecutorch