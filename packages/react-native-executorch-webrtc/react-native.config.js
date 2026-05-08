module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath:
          'import com.executorch.webrtc.ExecutorchWebRTCPackage;',
        packageInstance: 'new ExecutorchWebRTCPackage()',
      },
      ios: {},
    },
  },
};
