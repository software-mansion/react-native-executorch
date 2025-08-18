// ThreadPool.js
class NativeThreadPool {
  constructor() {
    if (!global.NativeThreadPool) {
      throw new Error('NativeThreadPool not installed');
    }
    this.pool = global.NativeThreadPool;
  }

  // Execute any native function
  async executeNative(functionName, args) {
    return await this.pool.executeNative(functionName, JSON.stringify(args));
  }

  // Specific methods for common tasks
  async runInference(prompt, options = {}) {
    return await this.executeNative('runInference', { prompt, ...options });
  }

  async processImage(imagePath, options = {}) {
    return await this.executeNative('processImage', { imagePath, ...options });
  }

  async heavyComputation(data) {
    return await this.executeNative('heavyComputation', data);
  }

  // Get thread pool statistics
  getStats() {
    return this.pool.getStats();
  }
}

export default new NativeThreadPool();
