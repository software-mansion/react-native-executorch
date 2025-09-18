#pragma once

#include <executorch/extension/threadpool/cpuinfo_utils.h>
#include <executorch/extension/threadpool/threadpool.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::threads::utils {

void unsafeSetupThreadPool(uint32_t num_of_cores = 0) {
  auto num_of_perf_cores =
      ::executorch::extension::cpuinfo::get_num_performant_cores();
  log(LOG_LEVEL::Info, "Detected ", num_of_perf_cores, " performant cores");
  // setting num_of_cores to floor(num_of_perf_cores / 2) + 1) because
  // depending on cpu arch as when possible we want to leave at least 2
  // performant cores for other tasks (setting more actually results in drop
  // of performance). For older devices (i.e. samsung s22) resolves to 3
  // cores, and for newer ones (like OnePlus 12) resolves to 4, which when
  // benchmarked gives highest throughput. For iPhones they usually have 2
  // performance cores
  auto _num_of_cores = num_of_cores
                           ? num_of_cores
                           : static_cast<uint32_t>(num_of_perf_cores / 2) + 1;
  const auto threadpool = ::executorch::extension::threadpool::get_threadpool();
  threadpool->_unsafe_reset_threadpool(_num_of_cores);
  log(LOG_LEVEL::Info, "Configuring xnnpack for",
      threadpool->get_thread_count(), "threads");
}

} // namespace rnexecutorch::threads::utils
