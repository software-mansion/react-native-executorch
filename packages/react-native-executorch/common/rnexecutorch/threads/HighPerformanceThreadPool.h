// HighPerformanceThreadPool.h
#pragma once

#include <algorithm>
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <fstream>
#include <functional>
#include <future>
#include <memory>
#include <mutex>
#include <pthread.h>
#include <queue>
#include <ranges>
#include <sched.h>
#include <sys/resource.h>
#include <thread>
#include <unistd.h>
#include <vector>

#include <executorch/extension/threadpool/cpuinfo_utils.h>
#include <rnexecutorch/Log.h>

#ifdef __APPLE__
#include <sys/syscall.h>
#endif

#ifdef __ANDROID__
#include <sys/types.h>
#endif

namespace rnexecutorch::threads {

enum class Priority { LOW, NORMAL, HIGH, REALTIME };

struct ThreadConfig {
  bool pinToPerformanceCores{true};
  std::string namePrefix{"RN_ET_Worker"};
};

class HighPerformanceThreadPool {
public:
  explicit HighPerformanceThreadPool(size_t numThreads = 1,
                                     ThreadConfig cfg = ThreadConfig())
      : config(std::move(cfg)) {

#ifdef __ANDROID__
    detectCPUTopology();
    numThreads = std::min(numThreads, performanceCores.size());
#endif

    for (size_t i = 0; i < numThreads; i++) {
      workers.emplace_back(&HighPerformanceThreadPool::workerThread, this, i);
    }

    log(LOG_LEVEL::Debug, "Thread pool initialized with", numThreads,
        "workers.");
  }

  ~HighPerformanceThreadPool() { shutdown(); }

  // Submit a task and get a future for the result
  template <typename Func, typename... Args>
  auto submit(Func &&func, Args &&...args)
      -> std::future<decltype(func(args...))> {
    return submitWithPriority(Priority::NORMAL, std::forward<Func>(func),
                              std::forward<Args>(args)...);
  }

  // Submit a task with specific priority
  template <typename Func, typename... Args>
  auto submitWithPriority(Priority priority, Func &&func, Args &&...args)
      -> std::future<decltype(func(args...))> {

    using ReturnType = decltype(func(args...));

    // Create a packaged task
    auto boundFunc =
        std::bind(std::forward<Func>(func), std::forward<Args>(args)...);
    auto task = std::make_unique<Task<decltype(boundFunc), ReturnType>>(
        std::move(boundFunc));
    auto future = task->getFuture();

    // Add to queue
    {
      std::scoped_lock lock(queueMutex);

      if (!running) {
        throw std::runtime_error("Thread pool is shutting down");
      }

      WorkItem item(std::move(task), priority,
                    std::chrono::steady_clock::now());

      taskQueue.push(std::move(item));
    }

    condition.notify_one();
    return future;
  }

  // Execute a task and wait for result
  template <typename Func, typename... Args>
  auto execute(Func &&func, Args &&...args) -> decltype(func(args...)) {
    auto future = submit(std::forward<Func>(func), std::forward<Args>(args)...);
    return future.get();
  }

  // Fire and forget task
  template <typename Func, typename... Args>
  void submitDetached(Func &&func, Args &&...args) {
    submit(std::forward<Func>(func), std::forward<Args>(args)...);
    // Future is destroyed, task still runs
  }

  void shutdown() {
    if (!running.exchange(false)) {
      return;
    }

    condition.notify_all();

    for (auto &worker : workers) {
      if (worker.joinable()) {
        worker.join();
      }
    }
  }

private:
  // Task wrapper that can hold any callable
  class ITask {
  public:
    virtual ~ITask() = default;
    virtual void execute() = 0;
  };

  template <typename Func, typename Result> class Task : public ITask {
  public:
    Task(Func &&f) : func(std::forward<Func>(f)) {}

    void execute() override {
      try {
        if constexpr (std::is_void_v<Result>) {
          func();
          promise.set_value();
        } else {
          promise.set_value(func());
        }
      } catch (...) {
        promise.set_exception(std::current_exception());
      }
    }

    std::future<Result> getFuture() { return promise.get_future(); }

  private:
    Func func;
    std::promise<Result> promise;
  };

  class WorkItem {
  public:
    WorkItem() = default;
    WorkItem(std::unique_ptr<ITask> task, Priority priority,
             std::chrono::steady_clock::time_point enqueueTime)
        : task(std::move(task)), priority(priority), enqueueTime(enqueueTime) {}

    std::unique_ptr<ITask> task;

    bool operator<(const WorkItem &other) const {
      return priority != other.priority ? priority < other.priority
                                        : enqueueTime > other.enqueueTime;
    }

  private:
    Priority priority;
    std::chrono::steady_clock::time_point enqueueTime;
  };

  // Thread pool state
  std::vector<std::thread> workers;
  std::priority_queue<WorkItem> taskQueue;
  std::mutex queueMutex;
  std::condition_variable condition;
  std::atomic<bool> running{true};
  std::atomic<size_t> activeWorkers{0};
  std::atomic<size_t> totalTasksProcessed{0};

#ifdef __ANDROID__
  // Performance cores
  std::vector<int32_t> performanceCores;
  std::vector<int32_t> efficiencyCores;
#endif

  // Configuration
  ThreadConfig config;

  void detectCPUTopology() {
#ifdef __ANDROID__
    struct CoreInfo {
      int32_t id;
      int64_t maxFreq;
    };

    std::vector<CoreInfo> cores;
    const auto numOfCores = std::thread::hardware_concurrency();

    for (int32_t i = 0; std::cmp_less(i, numOfCores); ++i) {
      std::string path = "/sys/devices/system/cpu/cpu" + std::to_string(i) +
                         "/cpufreq/cpuinfo_max_freq";
      std::ifstream file(path);
      if (!file.good()) {
        break;
      }

      CoreInfo info;
      info.id = i;
      file >> info.maxFreq;
      cores.push_back(info);
    }

    if (cores.empty()) {
      log(LOG_LEVEL::Debug, "Could not detect CPU topology");
      return;
    }

    // Sort by frequency
    std::ranges::sort(cores, [](const CoreInfo &a, const CoreInfo &b) {
      return a.maxFreq > b.maxFreq;
    });

    // Classify cores
    const auto numOfPerfCores =
        ::executorch::extension::cpuinfo::get_num_performant_cores();

    constexpr float kKiloToGigaRatio = 1e6;
    for (int32_t i = 0; i < cores.size(); ++i) {
      if (i < numOfPerfCores) {
        performanceCores.push_back(cores[i].id);
        log(LOG_LEVEL::Debug, "Performance core:", cores[i].id, "(",
            cores[i].maxFreq / kKiloToGigaRatio, "GHz)");
      } else {
        efficiencyCores.push_back(cores[i].id);
        log(LOG_LEVEL::Debug, "Efficiency core:", cores[i].id, "(",
            cores[i].maxFreq / kKiloToGigaRatio, "GHz)");
      }
    }
#endif
  }

#ifdef __ANDROID__
  inline uint64_t getCurrentThreadId() { return gettid(); }
#endif

  inline void setCurrentThreadName(const std::string &name) {
#ifdef __ANDROID__
    pthread_setname_np(pthread_self(), name.c_str());
#elif defined(__APPLE__)
    pthread_setname_np(name.c_str());
#endif
  }

  void configureThread(uint32_t workerIndex) {
    std::string threadName = config.namePrefix + std::to_string(workerIndex);
    setCurrentThreadName(threadName.c_str());

#ifdef __ANDROID__
    if (config.pinToPerformanceCores && !performanceCores.empty()) {
      setCPUAffinity();
    }
#endif

    setThreadPriority();

    log(LOG_LEVEL::Debug, "Worker", workerIndex,
        "configured:", threadName.c_str());
  }

  void setCPUAffinity() {
    // AFAIK it is not possible on iOS
#ifdef __ANDROID__
    if (performanceCores.empty()) {
      log(LOG_LEVEL::Error, "No cores specified for affinity setting");
      return;
    }

    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);

    for (int32_t core : performanceCores) {
      CPU_SET(core, &cpuset);
    }

    pid_t tid = getCurrentThreadId();
    log(LOG_LEVEL::Debug, "Thread id", tid);
    if (sched_setaffinity(tid, sizeof(cpuset), &cpuset) == 0) {
      log(LOG_LEVEL::Debug, "Thread pinned to cores:", performanceCores);
    } else {
      log(LOG_LEVEL::Debug, "Failed to set CPU affinity (error:", errno,
          "). Continuing without affinity.");
    }
#endif
  }

  void setThreadPriority() {
    // pthread_setschedparam doesn't work on android because permissions reasons
    // and in general does not provide visible improvements on iOS

    // Set nice value as fallback or additional priority boost
    constexpr int nice_value = 0;
    if (setpriority(PRIO_PROCESS, 0, nice_value) != 0) {
      log(LOG_LEVEL::Debug, "Failed to set nice value");
    } else {
      log(LOG_LEVEL::Debug, "Set nice value", nice_value);
    }
  }

  void processTask(const WorkItem &item) {
    activeWorkers++;

    try {
      item.task->execute();
    } catch (const std::exception &e) {
      log(LOG_LEVEL::Error, "Task failed:", e.what());
      activeWorkers--;
      throw;
    }

    activeWorkers--;
    totalTasksProcessed++;
  }

  void workerThread(int workerIndex) {
    configureThread(workerIndex);

    while (running) {
      WorkItem item;

      {
        std::unique_lock<std::mutex> lock(queueMutex);
        condition.wait(lock, [this] { return !taskQueue.empty() || !running; });

        if (!running && taskQueue.empty()) {
          break;
        }

        if (!taskQueue.empty()) {
          item = std::move(const_cast<WorkItem &>(taskQueue.top()));
          taskQueue.pop();
        } else {
          continue;
        }
      }

      processTask(item);
    }

    log(LOG_LEVEL::Debug, "Worker", workerIndex, "shutting down");
  }
};

} // namespace rnexecutorch::threads
