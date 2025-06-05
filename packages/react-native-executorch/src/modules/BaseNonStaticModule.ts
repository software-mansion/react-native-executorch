export class BaseNonStaticModule {
  nativeModule: any = null;
  delete() {
    this.nativeModule.unload();
  }
}
