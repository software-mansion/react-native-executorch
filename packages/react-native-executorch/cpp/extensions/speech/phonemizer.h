#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <optional>
#include <string>
#include <string_view>

#include <phonemis/base/pipeline.h>

namespace rnexecutorch::extensions::speech {

class PhonemizerHostObject : public facebook::jsi::HostObject,
                             public std::enable_shared_from_this<PhonemizerHostObject> {
public:
    explicit PhonemizerHostObject(const std::string &lang,
                                  const std::optional<std::string> &taggerPath,
                                  const std::optional<std::string> &lexiconPath,
                                  const std::optional<std::string> &neuralModelPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    /**
     * Tries to acquire a unique lock on the phonemizer's mutex.
     *
     * @param context Context description used to generate helpful error messages.
     * @return A unique lock protecting the pipeline.
     * @throws core::error::RnExecuTorchException with code ResourceBusy if the
     * lock is currently held by another thread, or ResourceDisposed if the
     * phonemizer has already been disposed.
     */
    [[nodiscard]] std::unique_lock<std::mutex> tryLockUnique(std::string_view context);

    /** Owning pointer to the underlying phonemis G2P pipeline. */
    std::unique_ptr<phonemis::Pipeline> pipeline_;
    /** Mutex guarding concurrent access to the pipeline. */
    std::mutex mutex_;
};

void install_createPhonemizer(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

} // namespace rnexecutorch::extensions::speech
