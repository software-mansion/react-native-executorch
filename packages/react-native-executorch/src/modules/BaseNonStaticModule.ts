export class BaseNonStaticModule {
  nativeModule: any = null;
  delete() {
    if (this.nativeModule !== null) {
      this.nativeModule.unload();
    }
  }
}
