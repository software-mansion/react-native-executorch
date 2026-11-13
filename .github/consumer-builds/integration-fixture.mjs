import assert from 'node:assert/strict';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const integrationPlugins = [
  ['@sentry/react-native/expo', { organization: 'consumer-fixture', project: 'consumer-fixture' }],
  '@react-native-firebase/app',
  ['react-native-vision-camera', { enableMicrophonePermission: true }],
  [
    'react-native-audio-api',
    {
      iosBackgroundMode: true,
      iosMicrophonePermission: 'Consumer compatibility fixture microphone access.',
      androidPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
      ],
    },
  ],
];

export function prepareIntegrationFixture(directory, appFixtures, bundleIdentifier) {
  copyFileSync(join(appFixtures, 'App.integration.jsx'), join(directory, 'App.jsx'));
  // Deliberately synthetic build inputs: no Firebase project, services or credentials.
  writeFileSync(
    join(directory, 'google-services.json'),
    JSON.stringify(
      {
        project_info: { project_number: '123456789012', project_id: 'rnet-consumer-fixture' },
        client: [
          {
            client_info: {
              mobilesdk_app_id: '1:123456789012:android:0123456789abcdef',
              android_client_info: { package_name: bundleIdentifier },
            },
            api_key: [{ current_key: 'AIzaSy' + '0'.repeat(33) }],
          },
        ],
        configuration_version: '1',
      },
      null,
      2
    ) + '\n'
  );
  writeFileSync(
    join(directory, 'GoogleService-Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>API_KEY</key><string>AIzaSy${'0'.repeat(33)}</string>
<key>GCM_SENDER_ID</key><string>123456789012</string>
<key>PLIST_VERSION</key><string>1</string>
<key>BUNDLE_ID</key><string>${bundleIdentifier}</string>
<key>PROJECT_ID</key><string>rnet-consumer-fixture</string>
<key>GOOGLE_APP_ID</key><string>1:123456789012:ios:0123456789abcdef</string>
<key>IS_ANALYTICS_ENABLED</key><false/>
</dict></plist>
`
  );
  writeFileSync(
    join(directory, 'metro.config.js'),
    `const { getSentryExpoConfig } = require('@sentry/react-native/metro');
module.exports = getSentryExpoConfig(__dirname);
`
  );
}

export function verifyIntegrationFixture(directory, platform) {
  const read = (file) => readFileSync(join(directory, file), 'utf8');
  if (platform === 'android') {
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    for (const permission of ['CAMERA', 'RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS']) {
      assert.ok(manifest.includes(`android.permission.${permission}`), `Missing ${permission}`);
    }
    assert.ok(read('android/app/build.gradle').includes('com.google.gms.google-services'));
    assert.ok(read('android/app/build.gradle').includes('sentry.gradle'));
    assert.equal(
      JSON.parse(read('android/app/google-services.json')).project_info.project_id,
      'rnet-consumer-fixture'
    );
  } else {
    const info = read('ios/ConsumerBuild/Info.plist');
    for (const key of [
      'NSCameraUsageDescription',
      'NSMicrophoneUsageDescription',
      'UIBackgroundModes',
    ]) {
      assert.ok(info.includes(`<key>${key}</key>`), `Missing ${key}`);
    }
    assert.ok(info.includes('<string>audio</string>'));
    assert.equal(JSON.parse(read('ios/Podfile.properties.json'))['ios.useFrameworks'], 'dynamic');
    const project = read('ios/ConsumerBuild.xcodeproj/project.pbxproj');
    assert.ok(project.includes('GoogleService-Info.plist'));
    assert.ok(project.includes('sentry-xcode.sh'));
  }
  console.log(`PASS: ${platform} integration config plugins modified the generated native project`);
}
