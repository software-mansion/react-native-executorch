// HighPerformanceThreadPool.h
#pragma once

#include <algorithm>
#include <android/log.h>
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
#include <unistd.h>
#include <vector>

#define LOG_TAG "HPThreadPool"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)
enum class Priority { LOW, NORMAL, HIGH, REALTIME };

struct ThreadConfig {
  bool pinToPerformanceCores{true};
  Priority priority{Priority::HIGH};
  size_t stackSize{8 * 1024 * 1024};             // 8MB default
  std::optional<std::vector<int>> specificCores; // Pin to specific cores
  std::string namePrefix{"HPWorker"};
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
      // Higher priority first, then earlier enqueue time
      if (priority != other.priority) {
        return priority < other.priority;
      }
      return enqueueTime > other.enqueueTime;
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
        log(rnexecutorch::LOG_LEVEL::Error, "Performance core: %d (%.2f GHz)",
            core.id, core.maxFreq / 1000000.0);
      } else {
        efficiencyCores.push_back(core.id);
        log(rnexecutorch::LOG_LEVEL::Error, "Efficiency core: %d (%.2f GHz)",
            core.id, core.maxFreq / 1000000.0);
      }
    }
  }

  void configureThread(int workerIndex) {
    // Set thread name
    std::string threadName = config.namePrefix + std::to_string(workerIndex);
    pthread_setname_np(pthread_self(), threadName.c_str());

    // Configure CPU affinity
    if (config.specificCores.has_value()) {
      // Pin to specific cores provided by user
      setCPUAffinity(config.specificCores.value());
    } else if (config.pinToPerformanceCores && !performanceCores.empty()) {
      // Pin to performance cores
      setCPUAffinity(performanceCores);
    }

    // Set thread priority
    setThreadPriority(config.priority);

    log(rnexecutorch::LOG_LEVEL::Error, "Worker %d configured: %s", workerIndex,
        threadName.c_str());
  }

  void setCPUAffinity(const std::vector<int> &cores) {
    if (cores.empty()) {
      log(rnexecutorch::LOG_LEVEL::Error,
          "No cores specified for affinity setting");
      return;
    }

    // Validate core indices first
    int maxCores = std::thread::hardware_concurrency();
    for (int core : cores) {
      if (core < 0 || core >= maxCores) {
        log(rnexecutorch::LOG_LEVEL::Error, "Invalid core index %d (max: %d)",
            core, maxCores - 1);
        return;
      }
    }

    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);

    for (int core : cores) {
      CPU_SET(core, &cpuset);
    }

    // Use sched_setaffinity for Android compatibility
    pid_t tid = gettid();
    log(rnexecutorch::LOG_LEVEL::Info, "Thread id ", tid);
    if (sched_setaffinity(tid, sizeof(cpuset), &cpuset) == 0) {
      std::string coreList;
      for (size_t i = 0; i < cores.size(); ++i) {
        coreList += std::to_string(cores[i]);
        if (i < cores.size() - 1)
          coreList += ",";
      }
      log(rnexecutorch::LOG_LEVEL::Info, "Thread pinned to cores: %s",
          coreList.c_str());
    } else {
      log(rnexecutorch::LOG_LEVEL::Error,
          "Failed to set CPU affinity (error: %d). Continuing without "
          "affinity.",
          errno);
    }
  }

  void setThreadPriority(Priority priority) {
    int nice_value = 0;
    int sched_policy = SCHED_OTHER;
    int sched_priority = 0;

    switch (priority) {
    case Priority::LOW:
      nice_value = 10;
      break;
    case Priority::NORMAL:
      nice_value = 0;
      break;
    case Priority::HIGH:
      nice_value = -10;
      sched_policy = SCHED_FIFO;
      sched_priority = sched_get_priority_min(SCHED_FIFO);
      break;
    case Priority::REALTIME:
      nice_value = -20;
      sched_policy = SCHED_FIFO;
      sched_priority = sched_get_priority_max(SCHED_FIFO) - 1;
      break;
    }

    // Try to set real-time scheduling
    if (sched_policy != SCHED_OTHER) {
      struct sched_param param;
      param.sched_priority = sched_priority;
      if (pthread_setschedparam(pthread_self(), sched_policy, &param) != 0) {
        log(rnexecutorch::LOG_LEVEL::Error,
            "Failed to set real-time scheduling, falling back to nice value");
      }
      return;
    }

    // Set nice value as fallback or additional priority boost
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
        LOGE("Task failed: %s", e.what());
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

    LOGI("Worker %d shutting down", workerIndex);
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

    log(rnexecutorch::LOG_LEVEL::Error,
        "Thread pool initialized with %zu workers", numThreads);
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

    LOGI("Thread pool shut down. Stats: completed=%llu, failed=%llu, "
         "avg_wait=%.1fms, avg_exec=%.1fms",
         stats.tasksCompleted.load(), stats.tasksFailed.load(),
         stats.tasksCompleted > 0
             ? (double)stats.totalWaitTimeMs / stats.tasksCompleted
             : 0,
         stats.tasksCompleted > 0
             ? (double)stats.totalExecutionTimeMs / stats.tasksCompleted
             : 0);
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