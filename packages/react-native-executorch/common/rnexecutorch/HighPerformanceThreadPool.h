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
#include <optional>
#include <pthread.h>
#include <queue>
#include <rnexecutorch/Log.h>
#include <sched.h>
#include <sys/resource.h>
#include <thread>
#include <vector>

#ifdef __APPLE__
#include <mach/mach.h>
#include <pthread.h>
#include <sys/syscall.h>
#include <unistd.h>
#endif

#ifdef __ANDROID__
#include <sys/types.h>
#include <unistd.h>
#endif

enum class Priority { LOW, NORMAL, HIGH, REALTIME };

struct ThreadConfig {
  bool pinToPerformanceCores{true};
  std::string namePrefix{"RN_ET_Worker"};
};

class HighPerformanceThreadPool {
public:
private:
  // Task wrapper that can hold any callable
  class ITask {
  public:
    virtual ~ITask() = default;
    virtual void execute() = 0;
  };

  template <typename Func, typename Result> class Task : public ITask {
  private:
    Func func;
    std::promise<Result> promise;

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
  };

  struct WorkItem {
    std::unique_ptr<ITask> task;
    Priority priority;
    std::chrono::steady_clock::time_point enqueueTime;

    bool operator<(const WorkItem &other) const {
      return priority != other.priority ? priority < other.priority
                                        : enqueueTime > other.enqueueTime;
    }
  };

  // Thread pool state
  std::vector<std::thread> workers;
  std::priority_queue<WorkItem> taskQueue;
  std::mutex queueMutex;
  std::condition_variable condition;
  std::atomic<bool> running{true};
  std::atomic<size_t> activeWorkers{0};
  std::atomic<size_t> totalTasksProcessed{0};

  // Performance cores
  std::vector<int> performanceCores;
  std::vector<int> efficiencyCores;

  // Configuration
  ThreadConfig config;

  // Statistics
  struct Stats {
    std::atomic<uint64_t> tasksCompleted{0};
    std::atomic<uint64_t> tasksFailed{0};
    std::atomic<uint64_t> totalWaitTimeMs{0};
    std::atomic<uint64_t> totalExecutionTimeMs{0};
  } stats;

private:
  void detectCPUTopology() {
    struct CoreInfo {
      int id;
      long maxFreq;
    };

    std::vector<CoreInfo> cores;

    for (int i = 0; i < 32; i++) { // Check up to 32 cores
      std::string path = "/sys/devices/system/cpu/cpu" + std::to_string(i) +
                         "/cpufreq/cpuinfo_max_freq";
      std::ifstream file(path);
      if (!file.good())
        break;

      CoreInfo info;
      info.id = i;
      file >> info.maxFreq;
      cores.push_back(info);
    }

    if (cores.empty()) {
      log(rnexecutorch::LOG_LEVEL::Error, "Could not detect CPU topology");
      return;
    }

    // Sort by frequency
    std::sort(cores.begin(), cores.end(),
              [](const CoreInfo &a, const CoreInfo &b) {
                return a.maxFreq > b.maxFreq;
              });

    // Classify cores
    long highestFreq = cores[0].maxFreq;
    long lowestFreq = cores.back().maxFreq;
    long threshold = lowestFreq + (highestFreq - lowestFreq) * 0.6;

    for (const auto &core : cores) {
      if (core.maxFreq >= threshold) {
        performanceCores.push_back(core.id);
        log(rnexecutorch::LOG_LEVEL::Error, "Performance core:", core.id, "(",
            core.maxFreq / 1000000.0, " GHz)");
      } else {
        efficiencyCores.push_back(core.id);
        log(rnexecutorch::LOG_LEVEL::Error, "Efficiency core:", core.id, "(",
            core.maxFreq / 1000000.0, " GHz)");
      }
    }
  }

  inline uint64_t getCurrentThreadId() {
#ifdef __ANDROID__
    return gettid();
#elif defined(__APPLE__)
    // Option 1: pthread_threadid_np (recommended)
    uint64_t tid;
    pthread_threadid_np(pthread_self(), &tid);
    return tid;

    // Option 2: syscall (deprecated but works)
    // return syscall(SYS_thread_selfid);

    // Option 3: Mach thread ID
    // return mach_thread_self();

    // Option 4: pthread_self as number (not unique across processes)
    // return (uint64_t)pthread_self();
#else
    return -1;
#endif
  }

  inline void setCurrentThreadName(const std::string &name) {
#ifdef __ANDROID__
    pthread_setname_np(pthread_self(), name.c_str());
#elif defined(__APPLE__)
    pthread_setname_np(name.c_str()); // Note: no thread parameter on iOS
#endif
  }

  void configureThread(int workerIndex) {
    // Set thread name
    std::string threadName = config.namePrefix + std::to_string(workerIndex);
    setCurrentThreadName(threadName.c_str());

    // Pin to performance cores
    if (config.pinToPerformanceCores && !performanceCores.empty()) {
      setCPUAffinity(performanceCores);
    }

    // Set thread priority
    setThreadPriority();

    log(rnexecutorch::LOG_LEVEL::Error, "Worker ", workerIndex,
        " configured: ", threadName.c_str());
  }

  void setCPUAffinity(const std::vector<int> &cores) {
#ifdef __ANDROID__
    if (cores.empty()) {
      log(rnexecutorch::LOG_LEVEL::Error,
          "No cores specified for affinity setting");
      return;
    }

    // Validate core indices first
    int maxCores = std::thread::hardware_concurrency();
    for (int core : cores) {
      if (core < 0 || core >= maxCores) {
        log(rnexecutorch::LOG_LEVEL::Error, "Invalid core index ", core,
            " (max: ", maxCores - 1, ")");
        return;
      }
    }

    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);

    for (int core : cores) {
      CPU_SET(core, &cpuset);
    }

    pid_t tid = getCurrentThreadId();
    log(rnexecutorch::LOG_LEVEL::Info, "Thread id ", tid);
    if (sched_setaffinity(tid, sizeof(cpuset), &cpuset) == 0) {
      log(rnexecutorch::LOG_LEVEL::Info, "Thread pinned to cores: ", cores);
    } else {
      log(rnexecutorch::LOG_LEVEL::Error,
          "Failed to set CPU affinity (error: ", errno,
          "). Continuing without affinity.");
    }
#endif
  }

  void setThreadPriority() {
    // pthread_setschedparam doesn't work on android because permissions reasons
    // and in general does not provide visible improvements on iOS

    // Set nice value as fallback or additional priority boost
    const int nice_value = 0;
    if (setpriority(PRIO_PROCESS, 0, nice_value) != 0) {
      log(rnexecutorch::LOG_LEVEL::Error, "Failed to set nice value");
    } else {
      log(rnexecutorch::LOG_LEVEL::Error, "Set nice value", nice_value);
    }
  }

  void workerThread(int workerIndex) {
    configureThread(workerIndex);

    while (running) {
      WorkItem item;

      {
        std::unique_lock<std::mutex> lock(queueMutex);
        condition.wait(lock, [this] { return !taskQueue.empty() || !running; });

        if (!running && taskQueue.empty())
          break;

        if (!taskQueue.empty()) {
          item = std::move(const_cast<WorkItem &>(taskQueue.top()));
          taskQueue.pop();
        } else {
          continue;
        }
      }

      // Process task
      activeWorkers++;

      auto startTime = std::chrono::steady_clock::now();
      auto waitTime = std::chrono::duration_cast<std::chrono::milliseconds>(
                          startTime - item.enqueueTime)
                          .count();
      stats.totalWaitTimeMs += waitTime;

      try {
        item.task->execute();
        stats.tasksCompleted++;
      } catch (const std::exception &e) {
        log(rnexecutorch::LOG_LEVEL::Error, "Task failed: ", e.what());
        stats.tasksFailed++;
      }

      auto endTime = std::chrono::steady_clock::now();
      auto executionTime =
          std::chrono::duration_cast<std::chrono::milliseconds>(endTime -
                                                                startTime)
              .count();
      stats.totalExecutionTimeMs += executionTime;

      activeWorkers--;
      totalTasksProcessed++;
    }

    log(rnexecutorch::LOG_LEVEL::Error, "Worker ", workerIndex,
        " shutting down");
  }

public:
  explicit HighPerformanceThreadPool(size_t numThreads = 1,
                                     ThreadConfig cfg = ThreadConfig())
      : config(std::move(cfg)) {

    detectCPUTopology();

    // Limit threads for CPU-bound tasks
    numThreads = std::min(
        numThreads,
        size_t(performanceCores.empty() ? 4 : performanceCores.size()));

    // Create worker threads
    for (size_t i = 0; i < numThreads; i++) {
      workers.emplace_back(&HighPerformanceThreadPool::workerThread, this, i);
    }

    log(rnexecutorch::LOG_LEVEL::Error, "Thread pool initialized with ",
        numThreads, " workers ", numThreads);
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
      std::lock_guard<std::mutex> lock(queueMutex);

      if (!running) {
        throw std::runtime_error("Thread pool is shutting down");
      }

      WorkItem item;
      item.task = std::move(task);
      item.priority = priority;
      item.enqueueTime = std::chrono::steady_clock::now();

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
    if (!running.exchange(false))
      return;

    condition.notify_all();

    for (auto &worker : workers) {
      if (worker.joinable()) {
        worker.join();
      }
    }
  }

  // Get pool statistics
  struct PoolStats {
    size_t queueSize;
    size_t activeWorkers;
    size_t totalWorkers;
    uint64_t tasksCompleted;
    uint64_t tasksFailed;
    double avgWaitTimeMs;
    double avgExecutionTimeMs;
  };

  PoolStats getStats() const {
    std::lock_guard<std::mutex> lock(const_cast<std::mutex &>(queueMutex));

    PoolStats poolStats;
    poolStats.queueSize = taskQueue.size();
    poolStats.activeWorkers = activeWorkers.load();
    poolStats.totalWorkers = workers.size();
    poolStats.tasksCompleted = stats.tasksCompleted.load();
    poolStats.tasksFailed = stats.tasksFailed.load();
    poolStats.avgWaitTimeMs =
        poolStats.tasksCompleted > 0
            ? (double)stats.totalWaitTimeMs / poolStats.tasksCompleted
            : 0;
    poolStats.avgExecutionTimeMs =
        poolStats.tasksCompleted > 0
            ? (double)stats.totalExecutionTimeMs / poolStats.tasksCompleted
            : 0;

    return poolStats;
  }
};