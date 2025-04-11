import { _ETInstallerModule } from '../../native/RnExecutorchModules';

export class ETInstallerModule {
  static module = new _ETInstallerModule();

  static install() {
    return this.module.install();
  }
}
