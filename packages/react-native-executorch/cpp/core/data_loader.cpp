#include "data_loader.h"

#include <cstdint>
#include <cstring>
#include <exception>
#include <format>
#include <thread>
#include <utility>

#include "conversions.h"
#include "error.h"

namespace rnexecutorch::core::data_loader {
namespace jsi = facebook::jsi;
using executorch::runtime::DataLoader;
using executorch::runtime::Error;
using executorch::runtime::FreeableBuffer;
using executorch::runtime::Result;

namespace {
void freeBuffer(void * /*context*/, void *data, size_t /*size*/) {
    // NOLINTNEXTLINE(cppcoreguidelines-avoid-c-arrays,modernize-avoid-c-arrays): matching deleter for the owning runtime-sized byte buffer
    std::default_delete<std::uint8_t[]>{}(static_cast<std::uint8_t *>(data));
}
} // namespace

struct LoadSession::State {
    struct Callbacks {
        jsi::Runtime *rt;
        std::string ctx;
        jsi::Object receiver;
        jsi::Function load;
        std::exception_ptr failure;

        jsi::ArrayBuffer read(size_t offset, size_t length) {
            auto result = load.callWithThis(*rt, receiver, static_cast<double>(offset), static_cast<double>(length));
            auto buffer = conversions::asType<jsi::ArrayBuffer>(*rt, ctx + ".load()", result);
            if (buffer.size(*rt) != length) {
                throw error::InvalidArgument(std::format("{}.load(): returned {} bytes, expected {}",
                                                         ctx, buffer.size(*rt), length));
            }
            return buffer;
        }
    };

    size_t byteLength;
    std::thread::id ownerThread;
    std::unique_ptr<Callbacks> callbacks;
};

class LoadSession::Adapter final : public DataLoader {
public:
    explicit Adapter(std::shared_ptr<State> state) : state_(std::move(state)) {}

    [[nodiscard]] Result<FreeableBuffer> load(size_t offset, size_t length, const SegmentInfo & /*segmentInfo*/) const override {
        if (auto status = validateRead(offset, length); status != Error::Ok) {
            return status;
        }
        if (length == 0) {
            return FreeableBuffer(nullptr, 0, nullptr);
        }
        auto &callbacks = *state_->callbacks;
        try {
            auto buffer = callbacks.read(offset, length);
            // NOLINTNEXTLINE(cppcoreguidelines-avoid-c-arrays,modernize-avoid-c-arrays): owning runtime-sized byte buffer
            auto copy = std::make_unique_for_overwrite<std::uint8_t[]>(length);
            std::memcpy(copy.get(), buffer.data(*callbacks.rt), length);
            return FreeableBuffer(copy.release(), length, freeBuffer);
        } catch (...) {
            callbacks.failure = std::current_exception();
            return Error::AccessFailed;
        }
    }

    Error load_into(size_t offset, size_t length, const SegmentInfo & /*segmentInfo*/, void *destination) const override {
        if (destination == nullptr && length != 0) {
            return Error::InvalidArgument;
        }
        if (auto status = validateRead(offset, length); status != Error::Ok) {
            return status;
        }
        if (length == 0) {
            return Error::Ok;
        }
        auto &callbacks = *state_->callbacks;
        try {
            auto buffer = callbacks.read(offset, length);
            std::memcpy(destination, buffer.data(*callbacks.rt), length);
            return Error::Ok;
        } catch (...) {
            callbacks.failure = std::current_exception();
            return Error::AccessFailed;
        }
    }

    [[nodiscard]] Result<size_t> size() const override { return state_->byteLength; }

private:
    [[nodiscard]] Error validateRead(size_t offset, size_t length) const {
        if (offset > state_->byteLength || length > state_->byteLength - offset) {
            return Error::InvalidArgument;
        }
        // Worker threads must never access the JS handles, including during
        // initialization. Only the owner thread reads/resets callbacks.
        if (state_->ownerThread != std::this_thread::get_id()) {
            return Error::InvalidState;
        }
        if (!state_->callbacks) {
            return Error::InvalidState;
        }
        return state_->callbacks->failure ? Error::AccessFailed : Error::Ok;
    }

    std::shared_ptr<State> state_;
};

LoadSession::LoadSession(jsi::Runtime &rt) : rt_(rt) {}

LoadSession::~LoadSession() {
    for (const auto &state : states_) {
        state->callbacks.reset();
    }
}

std::unique_ptr<DataLoader> LoadSession::create(const std::string &ctx, const jsi::Value &value) {
    auto receiver = conversions::asType<jsi::Object>(rt_, ctx, value);
    auto size = conversions::getRequiredProperty<jsi::Function>(rt_, ctx, receiver, "size");
    auto load = conversions::getRequiredProperty<jsi::Function>(rt_, ctx, receiver, "load");

    auto result = size.callWithThis(rt_, receiver);
    const auto length = conversions::asType<std::uint64_t>(rt_, ctx + ".size()", result);

    auto callbacks = std::make_unique<State::Callbacks>(&rt_, ctx, std::move(receiver), std::move(load), nullptr);
    auto state = std::make_shared<State>(static_cast<size_t>(length), std::this_thread::get_id(), std::move(callbacks));

    states_.push_back(state);

    return std::make_unique<Adapter>(std::move(state));
}

void LoadSession::rethrowIfFailed() const {
    for (const auto &state : states_) {
        if (state->callbacks->failure) {
            std::rethrow_exception(state->callbacks->failure);
        }
    }
}

} // namespace rnexecutorch::core::data_loader
